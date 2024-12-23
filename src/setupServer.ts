import {Application, json, urlencoded, Response, Request, NextFunction} from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import HTTP_Status from 'http-status-codes';
import 'express-async-errors';
import compression from 'compression';
import {config} from './config';
import {Server} from 'socket.io';
import {createClient} from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import applicationRoutes from './routes';
import { CustomError, IErrorResponse } from './shared/globals/helpers/error-handler';
import Logger from 'bunyan';

const SERVER_PORT = 5000;
const log:Logger = config.createLogger('Server');

export class ChattyServer{

  private app: Application;

  constructor(app: Application){
    this.app = app
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  public start(): void {}

  private securityMiddleware(app:Application) : void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600000, 
        secure: config.NODE_ENV != 'development',
      }))

    app.use(hpp())
    app.use(helmet())
    app.use(cors({
      origin: config.CLIENT_URL,
      credentials: true, 
      optionsSuccessStatus: 200 ,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

    }))
  }

  private standardMiddleware(app:Application) : void {
    app.use(compression())
    app.use(json({limit: '50mb'}))
    app.use(urlencoded({extended:true, limit: '50mb'}))
  }

  private routesMiddleware(app:Application) : void {
    applicationRoutes(app)
  }
  
  private globalErrorHandler(app: Application) : void  {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_Status.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, _next: NextFunction) => {
          log.error(error)
          if (error instanceof CustomError) {
            res.status(error.statusCode).json(error.serializeErrors());
            return; 
          }
          _next();
    });
  }

  private async startServer(app:Application) : Promise<void> {
      try{
        const httpServer : http.Server  = new http.Server(app)
        const socketIO: Server = await this.createSocketIO(httpServer)
        this.startHTTPServer(httpServer)
        this.socketIOConnections(socketIO)
      }
      catch(error){
        log.error(error)
      }
  }

  private async createSocketIO(httpServer: http.Server) : Promise<Server> {
    const io: Server = new Server(httpServer,{
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      }
    })

    const pubClient = createClient({url: config.REDIS_HOST})
    const subClient = pubClient.duplicate()

    await Promise.all([pubClient.connect(), subClient.connect()])
    io.adapter(createAdapter(pubClient, subClient))

    return io;

  }

  private startHTTPServer(httpServer: http.Server) : void {
    log.info(`Server has started with process ${process.pid}`)
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server running on port ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io:Server): void {}


}