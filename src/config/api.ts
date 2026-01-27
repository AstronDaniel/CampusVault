export const API_CONFIG = {
    BASE_URL: 'https://campus-vault-backend.vercel.app',
    TIMEOUT: 10000,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/v1/auth/login/mobile',
            REGISTER: '/api/v1/auth/register',
            LOGOUT: '/api/v1/auth/logout',
            RESET_PASSWORD: '/api/v1/auth/password/reset/request',
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
        }
    }
};
