import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import {getSession} from "next-auth/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const session = await getSession({req: req});

  if (!session) {
    res.status(401).json({message: "Not authenticated"});
    return;
  }

  if (req.method === "POST") {

    // TODO: Prevent creating a team with identical names?

    const createTeam = await prisma.team.create({
      data: {
        name: req.body.name,
      },
    });

    const createMembership = await prisma.membership.create({
      data: {
        teamId: createTeam.id,
        userId: session.user.id,
        role: 'OWNER',
        accepted: true,
      }
    });

    return res.status(201).setHeader('Location', process.env.BASE_URL + '/api/teams/1').send(null);
  }

  res.status(404).send(null);
}
