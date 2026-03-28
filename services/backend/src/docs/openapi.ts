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
    }
  ],
  tags: [{ name: 'Health' }, { name: 'Authentication' }],
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
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin'] }
        },
        required: ['id', 'email', 'role']
      },
      CredentialsRequest: {
        type: 'object',
        properties: {
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
              schema: { $ref: '#/components/schemas/CredentialsRequest' }
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
              schema: { $ref: '#/components/schemas/CredentialsRequest' }
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
    }
  }
} as const;

export { openApiDocument };
