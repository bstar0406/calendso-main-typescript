import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import {getSession} from "next-auth/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const session = await getSession({req});

  if (!session) {
    res.status(401).json({message: "Not authenticated"});
    return;
  }

  const isTeamOwner = !!await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      teamId: parseInt(req.query.team),
      role: 'OWNER'
    }
  });

  if ( ! isTeamOwner) {
    res.status(403).json({message: "You are not authorized to manage this team"});
    return;
  }

  // List members
  if (req.method === "GET") {
    const memberships = await prisma.membership.findMany({
      where: {
        teamId: parseInt(req.query.team),
      }
    });

    let members = await prisma.user.findMany({
      where: {
        id: {
          in: memberships.map( (membership) => membership.userId ),
        }
      }
    });

    members = members.map( (member) => {
      const membership = memberships.find( (membership) => member.id === membership.userId );
      return {
        ...member,
        role: membership.accepted ? membership.role : 'INVITEE',
      }
    });

    return res.status(200).json({ members: members });
  }

  // Cancel a membership (invite)
  if (req.method === "DELETE") {
    const memberships = await prisma.membership.delete({
      where: {
        userId_teamId: { userId: req.body.userId, teamId: parseInt(req.query.team) },
      }
    });
    return res.status(204).send(null);
  }

  // Promote or demote a member of the team

  res.status(200).json({});
}
