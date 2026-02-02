export const API_CONFIG = {
    BASE_URL: 'https://campus-vault-backend.vercel.app',
    TIMEOUT: 60000,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/v1/auth/login/mobile',
            REGISTER: '/api/v1/auth/register',
            LOGOUT: '/api/v1/auth/logout',
            RESET_PASSWORD_REQUEST: '/api/v1/auth/password/reset-code/request',
            RESET_PASSWORD_VALIDATE: '/api/v1/auth/password/reset-code/validate',
            RESET_PASSWORD_CONFIRM: '/api/v1/auth/password/reset-code/confirm',
            ME: '/api/v1/auth/me',
            STATS: '/api/v1/auth/me/stats',
        },
        DATA: {
            FACULTIES: '/api/v1/faculties',
            PROGRAMS: '/api/v1/programs',
            COURSE_UNITS: '/api/v1/course-units',
            SEARCH_AUTOCOMPLETE: '/api/v1/search/autocomplete',
            RESOURCES: '/api/v1/resources',
            BOOKMARKS: '/api/v1/resources/bookmarks',
            CHAT: '/api/v1/chat',
            USERS: '/api/v1/users',
            GENERATE_METADATA: '/api/v1/ai/generate-metadata',
        }
    }
};
