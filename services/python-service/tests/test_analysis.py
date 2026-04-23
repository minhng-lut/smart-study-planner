import unittest
from datetime import UTC, datetime
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.analytics import AnalyzeRequest, TaskInput, analyze


class AnalysisServiceTests(unittest.TestCase):
    def test_completed_tasks_have_none_risk_and_do_not_affect_workload(self):
        result = analyze(
            AnalyzeRequest(
                current_datetime=datetime(2026, 4, 19, 9, 0, tzinfo=UTC),
                tasks=[
                    TaskInput(
                        id=1,
                        title="Finished reading",
                        deadline=datetime(2026, 4, 18, 18, 0, tzinfo=UTC),
                        estimated_hours=4,
                        actual_hours=4,
                        status="completed",
                        course_id=2,
                    )
                ],
            )
        )

        self.assertEqual(result.overall_risk_level, "none")
        self.assertEqual(result.workload_summary.total_remaining_hours, 0)
        self.assertEqual(result.workload_summary.recommended_hours_per_day, 0)
        self.assertEqual(len(result.recommended_study_distribution), 0)
        self.assertEqual(result.task_risk_levels[0].risk_level, "none")
        self.assertEqual(len(result.task_priorities), 0)

    def test_overdue_task_is_high_risk_and_excluded_from_active_analysis(self):
        result = analyze(
            AnalyzeRequest(
                current_datetime=datetime(2026, 4, 19, 9, 0, tzinfo=UTC),
                tasks=[
                    TaskInput(
                        id=10,
                        title="Old quiz corrections",
                        deadline=datetime(2026, 4, 17, 18, 0, tzinfo=UTC),
                        estimated_hours=3,
                        actual_hours=0,
                        status="pending",
                    ),
                    TaskInput(
                        id=11,
                        title="Next week exercise",
                        deadline=datetime(2026, 4, 26, 18, 0, tzinfo=UTC),
                        estimated_hours=2,
                        actual_hours=0,
                        status="pending",
                    ),
                ],
            )
        )

        self.assertEqual(result.overall_risk_level, "high")
        self.assertEqual(result.overdue_tasks[0].task_id, 10)
        self.assertEqual(result.overdue_tasks[0].status, "overdue")
        self.assertEqual(result.overdue_tasks[0].days_overdue, 2)
        self.assertEqual(result.task_priorities[0].task_id, 11)
        self.assertNotIn(10, [task.task_id for task in result.task_priorities])
        self.assertNotIn(
            10, [item.task_id for item in result.recommended_study_distribution]
        )
        self.assertEqual(result.workload_summary.total_remaining_hours, 2)

    def test_workload_summary_uses_only_unfinished_remaining_hours(self):
        result = analyze(
            AnalyzeRequest(
                current_datetime=datetime(2026, 4, 19, 9, 0, tzinfo=UTC),
                tasks=[
                    TaskInput(
                        id=21,
                        title="Cloud report",
                        deadline=datetime(2026, 4, 21, 23, 59, tzinfo=UTC),
                        estimated_hours=8,
                        actual_hours=2,
                        status="in_progress",
                    ),
                    TaskInput(
                        id=22,
                        title="Database revision",
                        deadline=datetime(2026, 4, 25, 18, 0, tzinfo=UTC),
                        estimated_hours=4,
                        actual_hours=1,
                        status="pending",
                    ),
                    TaskInput(
                        id=23,
                        title="Completed notes",
                        deadline=datetime(2026, 4, 20, 18, 0, tzinfo=UTC),
                        estimated_hours=5,
                        actual_hours=5,
                        status="completed",
                    ),
                ],
            )
        )

        self.assertEqual(result.workload_summary.total_remaining_hours, 9)
        self.assertEqual(result.workload_summary.planning_days, 3)
        self.assertEqual(result.workload_summary.recommended_hours_per_day, 3)
        self.assertGreater(result.workload_summary.workload_score, 0)

    def test_study_distribution_allocates_urgent_work_earlier(self):
        result = analyze(
            AnalyzeRequest(
                current_datetime=datetime(2026, 4, 19, 9, 0, tzinfo=UTC),
                tasks=[
                    TaskInput(
                        id=31,
                        title="Urgent report",
                        deadline=datetime(2026, 4, 20, 23, 59, tzinfo=UTC),
                        estimated_hours=6,
                        actual_hours=0,
                        status="in_progress",
                    ),
                    TaskInput(
                        id=32,
                        title="Later review",
                        deadline=datetime(2026, 4, 24, 18, 0, tzinfo=UTC),
                        estimated_hours=4,
                        actual_hours=0,
                        status="pending",
                    ),
                ],
            )
        )

        allocations_by_task = {}
        for item in result.recommended_study_distribution:
            allocations_by_task.setdefault(item.task_id, 0)
            allocations_by_task[item.task_id] += item.hours

        self.assertAlmostEqual(allocations_by_task[31], 6)
        self.assertAlmostEqual(allocations_by_task[32], 4)
        self.assertEqual(result.recommended_study_distribution[0].task_id, 31)
        self.assertEqual(result.recommended_study_distribution[0].day, 1)

    def test_priority_score_is_normalized_to_zero_to_one_hundred(self):
        result = analyze(
            AnalyzeRequest(
                current_datetime=datetime(2026, 4, 19, 9, 0, tzinfo=UTC),
                tasks=[
                    TaskInput(
                        id=41,
                        title="Huge task due today",
                        deadline=datetime(2026, 4, 19, 23, 59, tzinfo=UTC),
                        estimated_hours=80,
                        actual_hours=0,
                        status="in_progress",
                    ),
                    TaskInput(
                        id=42,
                        title="Small task later",
                        deadline=datetime(2026, 4, 28, 18, 0, tzinfo=UTC),
                        estimated_hours=1,
                        actual_hours=0,
                        status="pending",
                    ),
                ],
            )
        )

        self.assertEqual(result.task_priorities[0].task_id, 41)
        self.assertLessEqual(result.task_priorities[0].priority_score, 100)
        self.assertGreaterEqual(result.task_priorities[0].priority_score, 0)
        self.assertGreater(
            result.task_priorities[0].priority_score,
            result.task_priorities[1].priority_score,
        )


if __name__ == "__main__":
    unittest.main()
