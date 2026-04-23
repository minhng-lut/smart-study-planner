from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import List, Optional

try:
    from pydantic import BaseModel
except ModuleNotFoundError:
    class BaseModel:
        def __init__(self, **data):
            for key, value in data.items():
                setattr(self, key, value)

RISK_ORDER = {"none": 0, "low": 1, "medium": 2, "high": 3}
DEFAULT_PLANNING_DAYS = 7
MAX_PRIORITY_SCORE = 100.0


class TaskInput(BaseModel):
    id: int
    title: str
    deadline: Optional[datetime] = None
    estimated_hours: float = 0
    actual_hours: float = 0
    status: str = "pending"
    course_id: Optional[int] = None


class AnalyzeRequest(BaseModel):
    tasks: List[TaskInput]
    current_datetime: Optional[datetime] = None


class TaskPriorityOutput(BaseModel):
    task_id: int
    title: str
    course_id: Optional[int] = None
    deadline: Optional[datetime] = None
    status: str
    remaining_hours: float
    days_left: Optional[int] = None
    priority_score: float


class TaskRiskOutput(BaseModel):
    task_id: int
    title: str
    course_id: Optional[int] = None
    deadline: Optional[datetime] = None
    status: str
    remaining_hours: float
    days_left: Optional[int] = None
    risk_level: str


class OverdueTaskOutput(BaseModel):
    task_id: int
    title: str
    course_id: Optional[int] = None
    deadline: Optional[datetime] = None
    status: str
    remaining_hours: float
    days_overdue: int


class WorkloadSummary(BaseModel):
    total_remaining_hours: float
    planning_days: int
    recommended_hours_per_day: float
    workload_score: float


class StudyDistributionItem(BaseModel):
    day: int
    date: str
    task_id: int
    hours: float


class AnalyzeResult(BaseModel):
    generated_at: datetime
    overall_risk_level: str
    workload_score: float
    recommended_hours_per_day: float
    task_priorities: List[TaskPriorityOutput]
    task_risk_levels: List[TaskRiskOutput]
    overdue_tasks: List[OverdueTaskOutput]
    workload_summary: WorkloadSummary
    recommended_study_distribution: List[StudyDistributionItem]


@dataclass
class PreparedTask:
    id: int
    title: str
    course_id: Optional[int]
    deadline: Optional[datetime]
    status: str
    remaining_hours: float
    days_left: Optional[int]
    priority_score: float
    risk_level: str
    completed: bool
    overdue: bool


def normalize_datetime(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def normalize_status(status: str) -> str:
    return (status or "pending").strip().lower()


def is_completed(status: str) -> bool:
    return normalize_status(status) == "completed"


def compute_days_left(deadline: Optional[datetime], now: datetime) -> Optional[int]:
    if deadline is None:
        return None

    return (deadline.date() - now.date()).days


def compute_priority_score(
    status: str, remaining_hours: float, days_left: Optional[int]
) -> float:
    if status == "completed" or (days_left is not None and days_left < 0):
        return 0.0

    # Priority is intentionally normalized to 0-100:
    # deadline pressure matters most, remaining work second, daily pressure third,
    # and status only breaks close ties.
    if days_left is None:
        deadline_score = 5.0
    elif days_left == 0:
        deadline_score = 45.0
    elif days_left <= 1:
        deadline_score = 40.0
    elif days_left <= 3:
        deadline_score = 32.0
    elif days_left <= 7:
        deadline_score = 24.0
    elif days_left <= 14:
        deadline_score = 14.0
    elif days_left <= 30:
        deadline_score = 7.0
    else:
        deadline_score = 2.0

    remaining_score = min(remaining_hours * 3.0, 30.0)

    if days_left is None:
        pressure_score = min(remaining_hours, 10.0)
    else:
        pressure_score = min(
            (remaining_hours / max(days_left + 1, 1)) * 8.0, 20.0
        )

    status_bonus = {
        "pending": 2.0,
        "in_progress": 5.0,
    }.get(status, 0.0)

    return round(
        min(
            deadline_score + remaining_score + pressure_score + status_bonus,
            MAX_PRIORITY_SCORE,
        ),
        2,
    )


def compute_task_risk(
    status: str, remaining_hours: float, days_left: Optional[int]
) -> str:
    if status == "completed":
        return "none"

    if status == "overdue" or (days_left is not None and days_left < 0):
        return "high"

    if days_left is None:
        return "medium" if remaining_hours >= 8 else "low"

    if days_left <= 1 and remaining_hours >= 4:
        return "high"

    if days_left <= 3 and remaining_hours >= 6:
        return "high"

    if days_left <= 3 and remaining_hours >= 2:
        return "medium"

    if days_left <= 7 and remaining_hours >= 4:
        return "medium"

    if days_left <= 14 and remaining_hours >= 8:
        return "medium"

    return "low"


def prepare_tasks(tasks: List[TaskInput], now: datetime) -> List[PreparedTask]:
    prepared: List[PreparedTask] = []

    for task in tasks:
        status = normalize_status(task.status)
        deadline = normalize_datetime(task.deadline)
        remaining_hours = round(
            max((task.estimated_hours or 0) - (task.actual_hours or 0), 0.0), 2
        )
        days_left = compute_days_left(deadline, now)
        overdue = (
            not is_completed(status)
            and remaining_hours > 0
            and days_left is not None
            and days_left < 0
        )
        effective_status = "overdue" if overdue else status
        priority_score = compute_priority_score(status, remaining_hours, days_left)
        risk_level = compute_task_risk(status, remaining_hours, days_left)

        prepared.append(
            PreparedTask(
                id=task.id,
                title=task.title,
                course_id=task.course_id,
                deadline=deadline,
                status=effective_status,
                remaining_hours=remaining_hours,
                days_left=days_left,
                priority_score=priority_score,
                risk_level=risk_level,
                completed=is_completed(status),
                overdue=overdue,
            )
        )

    return prepared


def determine_planning_days(tasks: List[PreparedTask]) -> int:
    unfinished = [
        task
        for task in tasks
        if not task.completed and not task.overdue and task.remaining_hours > 0
    ]

    if not unfinished:
        return 0

    future_deadlines = sorted(
        task.days_left for task in unfinished if task.days_left is not None
    )

    if future_deadlines:
        nearest_deadline = future_deadlines[0]
        return min(max(nearest_deadline + 1, 3), 14)

    return DEFAULT_PLANNING_DAYS


def compute_workload_summary(tasks: List[PreparedTask]) -> WorkloadSummary:
    unfinished = [task for task in tasks if not task.completed and not task.overdue]
    active = [task for task in unfinished if task.remaining_hours > 0]

    total_remaining_hours = round(sum(task.remaining_hours for task in active), 2)
    planning_days = determine_planning_days(tasks)

    if planning_days == 0:
        recommended_hours_per_day = 0.0
    else:
        recommended_hours_per_day = round(total_remaining_hours / planning_days, 2)

    high_risk_count = sum(1 for task in active if task.risk_level == "high")
    max_priority = max((task.priority_score for task in active), default=0.0)

    workload_score = round(
        min(
            100.0,
            recommended_hours_per_day * 15.0
            + high_risk_count * 10.0
            + max_priority / 5.0,
        ),
        2,
    )

    return WorkloadSummary(
        total_remaining_hours=total_remaining_hours,
        planning_days=planning_days,
        recommended_hours_per_day=recommended_hours_per_day,
        workload_score=workload_score,
    )


def determine_overall_risk(tasks: List[PreparedTask]) -> str:
    return max((task.risk_level for task in tasks), key=RISK_ORDER.get, default="none")


def build_study_distribution(
    tasks: List[PreparedTask],
    summary: WorkloadSummary,
    start_date: date,
) -> List[StudyDistributionItem]:
    active_tasks = [
        task
        for task in tasks
        if not task.completed and not task.overdue and task.remaining_hours > 0
    ]

    if not active_tasks or summary.planning_days == 0:
        return []

    daily_capacity = [
        summary.recommended_hours_per_day for _ in range(summary.planning_days)
    ]
    allocations: defaultdict[tuple[int, int], float] = defaultdict(float)

    sorted_tasks = sorted(
        active_tasks,
        key=lambda task: (
            -task.priority_score,
            task.days_left if task.days_left is not None else 9999,
            task.id,
        ),
    )

    for task in sorted_tasks:
        remaining = task.remaining_hours
        if task.days_left is None:
            last_day_index = summary.planning_days - 1
        elif task.days_left < 0:
            last_day_index = 0
        else:
            last_day_index = min(task.days_left, summary.planning_days - 1)

        for day_index in range(0, last_day_index + 1):
            if remaining <= 0:
                break

            available = daily_capacity[day_index]
            if available <= 0:
                continue

            allocation = min(remaining, available)
            allocations[(day_index, task.id)] += allocation
            daily_capacity[day_index] -= allocation
            remaining = round(remaining - allocation, 2)

        if remaining > 0:
            allocations[(last_day_index, task.id)] += remaining
            daily_capacity[last_day_index] -= remaining

    schedule: List[StudyDistributionItem] = []

    for (day_index, task_id), hours in sorted(allocations.items()):
        if hours <= 0:
            continue

        schedule.append(
            StudyDistributionItem(
                day=day_index + 1,
                date=(start_date + timedelta(days=day_index)).isoformat(),
                task_id=task_id,
                hours=round(hours, 2),
            )
        )

    return schedule


def build_priority_outputs(tasks: List[PreparedTask]) -> List[TaskPriorityOutput]:
    active_tasks = [
        task
        for task in tasks
        if not task.completed and not task.overdue and task.remaining_hours > 0
    ]
    ordered_tasks = sorted(active_tasks, key=lambda task: (-task.priority_score, task.id))

    return [
        TaskPriorityOutput(
            task_id=task.id,
            title=task.title,
            course_id=task.course_id,
            deadline=task.deadline,
            status=task.status,
            remaining_hours=task.remaining_hours,
            days_left=task.days_left,
            priority_score=task.priority_score,
        )
        for task in ordered_tasks
    ]


def build_risk_outputs(tasks: List[PreparedTask]) -> List[TaskRiskOutput]:
    return [
        TaskRiskOutput(
            task_id=task.id,
            title=task.title,
            course_id=task.course_id,
            deadline=task.deadline,
            status=task.status,
            remaining_hours=task.remaining_hours,
            days_left=task.days_left,
            risk_level=task.risk_level,
        )
        for task in sorted(tasks, key=lambda task: (task.id,))
    ]


def build_overdue_outputs(tasks: List[PreparedTask]) -> List[OverdueTaskOutput]:
    overdue_tasks = sorted(
        [task for task in tasks if task.overdue],
        key=lambda task: (task.days_left if task.days_left is not None else 0, task.id),
    )

    return [
        OverdueTaskOutput(
            task_id=task.id,
            title=task.title,
            course_id=task.course_id,
            deadline=task.deadline,
            status=task.status,
            remaining_hours=task.remaining_hours,
            days_overdue=abs(task.days_left or 0),
        )
        for task in overdue_tasks
    ]


def analyze(req: AnalyzeRequest) -> AnalyzeResult:
    now = normalize_datetime(req.current_datetime) or datetime.now(UTC)
    now = now.replace(microsecond=0)

    prepared_tasks = prepare_tasks(req.tasks, now)
    workload_summary = compute_workload_summary(prepared_tasks)
    study_distribution = build_study_distribution(
        prepared_tasks, workload_summary, now.date()
    )

    return AnalyzeResult(
        generated_at=now,
        overall_risk_level=determine_overall_risk(prepared_tasks),
        workload_score=workload_summary.workload_score,
        recommended_hours_per_day=workload_summary.recommended_hours_per_day,
        task_priorities=build_priority_outputs(prepared_tasks),
        task_risk_levels=build_risk_outputs(prepared_tasks),
        overdue_tasks=build_overdue_outputs(prepared_tasks),
        workload_summary=workload_summary,
        recommended_study_distribution=study_distribution,
    )
