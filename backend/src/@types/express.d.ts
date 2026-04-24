declare namespace Express {
  export interface Request {
    user: {
      sync_id: string;
      role?: string;
    };

    headers: {
      pre_authenticated_id: string;
    };
  }
}
