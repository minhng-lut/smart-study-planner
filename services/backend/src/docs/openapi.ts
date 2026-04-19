const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Smart Study Planner Backend API',
    version: '1.0.0',
    description:
      'Authentication, planning, and analytics endpoints for the Smart Study Planner backend.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local backend server'
    },
    {
      url: '/api',
      description: 'Behind Traefik reverse proxy'
    }
  ],
  tags: [{ name: 'Health' }, { name: 'Authentication' }, { name: 'Analysis' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['student', 'admin'] }
        },
        required: ['id', 'fullName', 'email', 'role']
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
        },
        required: ['email', 'password']
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
        },
        required: ['email', 'password']
      },
      RefreshTokenRequest: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' }
        },
        required: ['refreshToken']
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' }
        },
        required: ['user', 'accessToken', 'refreshToken']
      },
      MeResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' }
        },
        required: ['user']
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' }
        },
        required: ['status']
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        },
        required: ['message']
      },
      ValidationError: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Invalid request payload' },
          issues: { type: 'object', additionalProperties: true }
        },
        required: ['message', 'issues']
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          name: { type: 'string' },
          code: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          color: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          tasks: {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' }
          }
        },
        required: ['id', 'userId', 'name', 'createdAt', 'updatedAt']
      },
      CourseCreateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          color: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['name']
      },
      CourseUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          color: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          courseId: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          deadline: { type: 'string', format: 'date-time', nullable: true },
          estimatedHours: { type: 'number', nullable: true },
          actualHours: { type: 'number', nullable: true },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'overdue']
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            nullable: true
          },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'courseId', 'title', 'createdAt', 'updatedAt']
      },
      TaskCreateRequest: {
        type: 'object',
        properties: {
          courseId: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string', format: 'date-time' },
          estimatedHours: { type: 'number' },
          actualHours: { type: 'number' },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'overdue']
          },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['courseId', 'title']
      },
      TaskUpdateRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          deadline: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' },
          estimatedHours: { type: 'number' },
          actualHours: { type: 'number' },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'overdue']
          },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      },
      AnalyzeRequest: {
        type: 'object',
        properties: {
          courseId: { type: 'integer' },
          currentDate: { type: 'string', format: 'date-time' }
        }
      },
      TaskPriorityAnalysis: {
        type: 'object',
        properties: {
          taskId: { type: 'integer' },
          title: { type: 'string' },
          courseId: { type: 'integer', nullable: true },
          deadline: { type: 'string', format: 'date-time', nullable: true },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'overdue']
          },
          remainingHours: { type: 'number' },
          daysLeft: { type: 'integer', nullable: true },
          priorityScore: { type: 'number' }
        },
        required: [
          'taskId',
          'title',
          'status',
          'remainingHours',
          'priorityScore'
        ]
      },
      TaskRiskAnalysis: {
        type: 'object',
        properties: {
          taskId: { type: 'integer' },
          title: { type: 'string' },
          courseId: { type: 'integer', nullable: true },
          deadline: { type: 'string', format: 'date-time', nullable: true },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'overdue']
          },
          remainingHours: { type: 'number' },
          daysLeft: { type: 'integer', nullable: true },
          riskLevel: {
            type: 'string',
            enum: ['none', 'low', 'medium', 'high']
          }
        },
        required: ['taskId', 'title', 'status', 'remainingHours', 'riskLevel']
      },
      WorkloadSummary: {
        type: 'object',
        properties: {
          totalRemainingHours: { type: 'number' },
          planningDays: { type: 'integer' },
          recommendedHoursPerDay: { type: 'number' },
          workloadScore: { type: 'number' }
        },
        required: [
          'totalRemainingHours',
          'planningDays',
          'recommendedHoursPerDay',
          'workloadScore'
        ]
      },
      StudyDistributionItem: {
        type: 'object',
        properties: {
          day: { type: 'integer' },
          date: { type: 'string' },
          taskId: { type: 'integer' },
          hours: { type: 'number' }
        },
        required: ['day', 'date', 'taskId', 'hours']
      },
      AnalyzeResult: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          generatedAt: { type: 'string', format: 'date-time' },
          workloadScore: { type: 'number' },
          riskLevel: {
            type: 'string',
            enum: ['none', 'low', 'medium', 'high']
          },
          recommendedHoursPerDay: { type: 'number' },
          taskPriorities: {
            type: 'array',
            items: { $ref: '#/components/schemas/TaskPriorityAnalysis' }
          },
          taskRiskLevels: {
            type: 'array',
            items: { $ref: '#/components/schemas/TaskRiskAnalysis' }
          },
          workloadSummary: { $ref: '#/components/schemas/WorkloadSummary' },
          recommendedStudyDistribution: {
            type: 'array',
            items: { $ref: '#/components/schemas/StudyDistributionItem' }
          }
        },
        required: [
          'id',
          'userId',
          'generatedAt',
          'workloadScore',
          'riskLevel',
          'recommendedHoursPerDay',
          'taskPriorities',
          'taskRiskLevels',
          'workloadSummary',
          'recommendedStudyDistribution'
        ]
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Backend is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid request payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '409': {
            description: 'User already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in and receive access and refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid request payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Rotate the refresh token and issue a new access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Refresh successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid request payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '401': {
            description: 'Refresh token invalid or expired',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' }
            }
          }
        },
        responses: {
          '204': {
            description: 'Logout successful'
          },
          '400': {
            description: 'Invalid request payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Authenticated user details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MeResponse' }
              }
            }
          },
          '401': {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/admin': {
      get: {
        tags: ['Authentication'],
        summary: 'Admin-only authorization check',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin access granted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          },
          '401': {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          },
          '403': {
            description: 'Forbidden for non-admin users',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/courses': {
      get: {
        tags: ['Courses'],
        summary: 'List courses for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of courses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    courses: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Course' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Courses'],
        summary: 'Create a new course',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CourseCreateRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Course created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    course: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          }
        }
      }
    },
    '/courses/{courseId}': {
      patch: {
        tags: ['Courses'],
        summary: 'Update an existing course',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'courseId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CourseUpdateRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Course updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    course: { $ref: '#/components/schemas/Course' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '404': {
            description: 'Course not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Courses'],
        summary: 'Delete a course',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'courseId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': { description: 'Course deleted' },
          '404': {
            description: 'Course not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/tasks': {
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskCreateRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Task created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { task: { $ref: '#/components/schemas/Task' } }
                }
              }
            }
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          }
        }
      }
    },
    '/tasks/{taskId}': {
      patch: {
        tags: ['Tasks'],
        summary: 'Update a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'taskId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskUpdateRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Task updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { task: { $ref: '#/components/schemas/Task' } }
                }
              }
            }
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'taskId',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '204': { description: 'Task deleted' },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/analysis': {
      get: {
        tags: ['Analysis'],
        summary: 'List saved analytics results for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Analysis results returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analyses: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AnalyzeResult' }
                    }
                  },
                  required: ['analyses']
                }
              }
            }
          },
          '401': {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Analysis'],
        summary: 'Generate analytics for the authenticated user tasks',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AnalyzeRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Analysis created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analysis: { $ref: '#/components/schemas/AnalyzeResult' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid request payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '401': {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    },
    '/analysis/{id}': {
      get: {
        tags: ['Analysis'],
        summary: 'Fetch one saved analytics result',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Analysis returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    analysis: { $ref: '#/components/schemas/AnalyzeResult' }
                  },
                  required: ['analysis']
                }
              }
            }
          },
          '400': {
            description: 'Invalid analysis id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          },
          '401': {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          },
          '404': {
            description: 'Analysis not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' }
              }
            }
          }
        }
      }
    }
  }
} as const;

export { openApiDocument };
