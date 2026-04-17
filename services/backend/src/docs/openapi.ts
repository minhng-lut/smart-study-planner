const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Smart Study Planner Backend API',
    version: '1.0.0',
    description:
      'Authentication and health endpoints for the Smart Study Planner backend.'
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
  tags: [{ name: 'Health' }, { name: 'Authentication' }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'ssp_access_token'
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
      AuthResponse: {
        type: 'object',
        description:
          'Returns the authenticated user. Access and refresh JWTs are issued as HttpOnly cookies.',
        properties: {
          user: { $ref: '#/components/schemas/User' }
        },
        required: ['user']
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
        summary: 'Log in and receive HttpOnly session cookies',
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
        summary: 'Rotate session cookies using the refresh cookie',
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
        summary: 'Revoke the refresh cookie and clear auth cookies',
        responses: {
          '204': {
            description: 'Logout successful'
          }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the current authenticated user',
        security: [{ cookieAuth: [] }],
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
        security: [{ cookieAuth: [] }],
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
    }
  }
} as const;

export { openApiDocument };
