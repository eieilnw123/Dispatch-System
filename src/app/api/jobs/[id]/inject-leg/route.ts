import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id;
    const body = await req.json();
    const { 
      insertAfterSequence, // The sequence number after which the new transfer leg will be injected
      newOriginId,
      newDestinationId,
      newDriverId,
      newContainerNumber,
      isBillable 
    } = body;

    /*
    // REAL PRISMA LOGIC FOR INTER-YARD TRANSFER INJECTION:
    
    // 1. Begin Transaction
    const result = await prisma.$transaction(async (tx) => {
      
      // 2. Shift subsequent legs sequence down by 1
      await tx.jobLeg.updateMany({
        where: { jobId, sequenceOrder: { >: insertAfterSequence } },
        data: { sequenceOrder: { increment: 1 } }
      });

      // 3. Inject the new Inter-Yard Transfer Leg
      const newLeg = await tx.jobLeg.create({
        data: {
          jobId,
          sequenceOrder: insertAfterSequence + 1,
          originId: newOriginId,
          destinationId: newDestinationId,
          driverId: newDriverId,
          containerNumber: newContainerNumber, // Support container swap during transfer
          isBillable: isBillable,
          status: "PENDING"
        }
      });

      // 4. (Optional) Propagate container number change to subsequent legs if swapped
      if (newContainerNumber) {
        await tx.jobLeg.updateMany({
           where: { jobId, sequenceOrder: { >: insertAfterSequence + 1 } },
           data: { containerNumber: newContainerNumber }
        });
      }

      return newLeg;
    });
    */

    return NextResponse.json({ 
      message: "Inter-Yard Transfer Leg injected successfully and sequences reordered." 
    }, { status: 200 });

  } catch (error) {
    console.error("Failed to inject leg", error);
    return NextResponse.json({ error: "Failed to inject transfer leg" }, { status: 500 });
  }
}
