import HTTP_Status from 'http-status-codes';

export interface IErrorResponse{
  message:string;
  statusCode:number;
  status: string;
  serializeErrors(): IError;
}

export interface IError{
  message:string;
  statusCode: number;
  status:string;
}

export abstract class CustomError extends Error{
  abstract statusCode: number;
  abstract status: string;

  constructor(message:string){
    super(message)
    Object.setPrototypeOf(this, new.target.prototype); // Fix prototype chain
  }

  serializeErrors():IError{
    return {
      message: this.message,
      status: this.status,
      statusCode: this.statusCode
    }
  }
}

export class JoiRequestValidationError extends CustomError{
  statusCode = HTTP_Status.BAD_REQUEST;
  status = 'error';

  constructor(message:string){
    super(message)
  }
}

export class BadRequestError extends CustomError{
  statusCode = HTTP_Status.BAD_REQUEST;
  status = 'error';

  constructor(message:string){
    super(message)
  }
}

export class NotFoundError extends CustomError{
  statusCode = HTTP_Status.NOT_FOUND;
  status = 'error';

  constructor(message:string){
    super(message)
  }
}

export class NotAuthorized extends CustomError{
  statusCode = HTTP_Status.UNAUTHORIZED;
  status = 'error';

  constructor(message:string){
    super(message)
  }
}

export class FileTooLargeError extends CustomError{
  statusCode = HTTP_Status.REQUEST_TOO_LONG;
  status = 'error';

  constructor(message:string){
    super(message)
  }
}

export class ServerError extends CustomError{
  statusCode = HTTP_Status.SERVICE_UNAVAILABLE;
  status = 'error';

  constructor(message:string){
    super(message)
  }
}