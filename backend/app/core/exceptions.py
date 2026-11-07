from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class CounterPilotException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, error_code: str = "BAD_REQUEST"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(message)


class NotFoundException(CounterPilotException):
    def __init__(self, message: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, error_code=error_code)


class BadRequestException(CounterPilotException):
    def __init__(self, message: str = "Bad request", error_code: str = "BAD_REQUEST"):
        super().__init__(message=message, status_code=status.HTTP_400_BAD_REQUEST, error_code=error_code)


class ConflictException(CounterPilotException):
    def __init__(self, message: str = "Resource conflict", error_code: str = "CONFLICT"):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, error_code=error_code)


class AssistantConfigurationException(CounterPilotException):
    def __init__(self, message: str = "BharatCode API key is not configured.", error_code: str = "ASSISTANT_NOT_CONFIGURED"):
        super().__init__(message=message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE, error_code=error_code)


class AssistantAuthException(CounterPilotException):
    def __init__(self, message: str = "BharatCode authentication failed.", error_code: str = "ASSISTANT_AUTH_ERROR"):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY, error_code=error_code)


class AssistantRateLimitException(CounterPilotException):
    def __init__(self, message: str = "BharatCode rate limit reached.", error_code: str = "ASSISTANT_RATE_LIMIT"):
        super().__init__(message=message, status_code=status.HTTP_429_TOO_MANY_REQUESTS, error_code=error_code)


class AssistantBusyException(CounterPilotException):
    def __init__(self, message: str = "BharatCode AI service is currently busy.", error_code: str = "ASSISTANT_BUSY"):
        super().__init__(message=message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE, error_code=error_code)


class AssistantTimeoutException(CounterPilotException):
    def __init__(self, message: str = "BharatCode AI model request timed out.", error_code: str = "ASSISTANT_TIMEOUT"):
        super().__init__(message=message, status_code=status.HTTP_504_GATEWAY_TIMEOUT, error_code=error_code)


class AssistantMalformedException(CounterPilotException):
    def __init__(self, message: str = "Unexpected response from BharatCode API.", error_code: str = "ASSISTANT_MALFORMED_RESPONSE"):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY, error_code=error_code)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(CounterPilotException)
    async def custom_exception_handler(request: Request, exc: CounterPilotException):
        return JSONResponse(
            status_code=exc.status_code,
            content=jsonable_encoder({
                "status": "error",
                "error_code": exc.error_code,
                "message": exc.message,
            }),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=jsonable_encoder({
                "status": "error",
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid request parameters",
                "details": exc.errors(),
            }),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=jsonable_encoder({
                "status": "error",
                "error_code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
            }),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder({
                "status": "error",
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
            }),
        )
