import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { CoachingExpert } from "@/services/Options";
import { DialogClose } from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import React, { useState } from "react";

function UserInputDialog({ children, coachingOption }) {
  const [selectedExpert, setSelectedExpert] = useState();
  const [topic, setTopic] = useState();
  const createDiscussionRoom = useMutation(api.DiscussionRoom.CreateNewRoom);
  const [loading, setLoading] = useState(false);
  const [openDialgo, setOpenDialog] = useState(false);
  const router = useRouter();

  const OnClickNext = async () => {
    setLoading(true);
    const result = await createDiscussionRoom({
      topic: topic,
      coachingOption: coachingOption?.name,
      expertName: selectedExpert,
    });
    console.log(result);
    setLoading(false);
    setOpenDialog(false);
    router.push("/discussion-room/" + result);
  };
  return (
    <Dialog open={openDialgo} onOpenChange={setOpenDialog}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{coachingOption.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-3">
              <h2 className="text-black">
                Enter a topic to master your skills in {coachingOption.name}
              </h2>
              <Textarea
                placeholder="Enter your topic here."
                className="mt-2"
                onChange={(event) => setTopic(event.target.value)}
              />
              <h2 className="text-black mt-5">Select your teacher</h2>
              <div className="grid grid-cols-3 xl:grid-cols-5 gap-6 mt-2">
                {CoachingExpert.map((expert, index) => {
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedExpert(expert.name)}
                      className="flex flex-col items-center"
                    >
                      <Image
                        src={expert.avatar}
                        alt={expert.name}
                        width={100}
                        height={100}
                        className={`rounded-2xl h-[80px] w-[80px] object-cover hover:border-3 border-primary p-0.5 cursor-pointer ${selectedExpert === expert.name && "scale-105 border-3 border-primary p-0.5 rounded-2xl"}`}
                      />
                      <h2 className="mt-1">{expert.name}</h2>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-5 justify-end mt-5">
                <DialogClose asChild>
                  <Button className="hover:cursor-pointer" variant={"ghost"}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  disabled={!topic || !selectedExpert || loading}
                  className="cursor-pointer"
                  onClick={OnClickNext}
                >
                  {loading && <LoaderCircle className="animate-spin" />}
                  Next
                </Button>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default UserInputDialog;
