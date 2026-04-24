import { Request, Response } from 'express';

export default class SessionsController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { email } = request.body;

    // 🔥 Mock authentication for local development
    return response.json({
      token: "local-dev-token-123",
      user: {
        id: "1",
        sync_id: "1",
        avatar_url: "",
        name: "Alisa",
        email: email || "alisa@test.com",
        status: "active",
        role: "admin",
        unread: 0,
        current_balance: 1000,
        formattedBalance: "$1,000",
        twoFactorAuthentication: false,
        hasTwoFactorCode: false,
        hasVerfiedTwoFactorCode: true,
      },
    });
  }
}
