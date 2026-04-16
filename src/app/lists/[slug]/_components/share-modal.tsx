"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Button,
  Chip,
  Modal,
  Separator,
  TextField,
  Label,
  Input,
  toast,
} from "@heroui/react";
import { TrashIcon, UserIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { api } from "~/trpc/react";

interface ShareModalProps {
  playlistId: string;
  playlistName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  playlistId,
  playlistName,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [username, setUsername] = useState("");
  const utils = api.useUtils();

  const { data } = api.share.getPlaylistMembers.useQuery(
    { playlistId },
    { enabled: isOpen },
  );

  const invite = api.share.invite.useMutation({
    onSuccess: (result) => {
      if (result.added) {
        toast.success(`${result.username} added to the list!`);
      } else {
        toast.success(`Invitation sent to ${result.username}`);
      }
      setUsername("");
      void utils.share.getPlaylistMembers.invalidate({ playlistId });
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const removeMember = api.share.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      void utils.share.getPlaylistMembers.invalidate({ playlistId });
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const cancelInvitation = api.share.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled");
      void utils.share.getPlaylistMembers.invalidate({ playlistId });
    },
    onError: (err: { message: string }) => toast.danger(err.message),
  });

  const handleInvite = () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    invite.mutate({ playlistId, discordUsername: trimmed });
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Share &ldquo;{playlistName}&rdquo;</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-6">
                {/* Invite form */}
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label className="text-sm">Discord username</Label>
                    <Input
                      placeholder="e.g. roy#1234"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleInvite();
                      }}
                    />
                  </div>
                  <Button
                    variant="primary"
                    isPending={invite.isPending}
                    isDisabled={!username.trim()}
                    onPress={handleInvite}
                  >
                    <PaperPlaneTiltIcon size={16} />
                    Invite
                  </Button>
                </div>

                <Separator />

                {/* Members */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">Members</h3>
                  {data?.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg border border-separator bg-surface p-3"
                    >
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary">
                          <UserIcon size={16} className="text-muted" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                      </div>
                      {member.isOwner ? (
                        <Chip variant="secondary" size="sm">
                          OWNER
                        </Chip>
                      ) : (
                        <Button
                          variant="ghost"
                          isIconOnly
                          size="sm"
                          className="text-danger"
                          isPending={removeMember.isPending}
                          onPress={() =>
                            removeMember.mutate({
                              playlistId,
                              userId: member.userId,
                            })
                          }
                        >
                          <TrashIcon size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pending invitations */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold">Pending invitations</h3>
                  {data?.invitations && data.invitations.length > 0 ? (
                    data.invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center gap-3 rounded-lg border border-separator bg-surface p-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary">
                          <UserIcon size={16} className="text-muted" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {inv.discordUsername}
                          </p>
                          <p className="text-xs text-muted">
                            Invited by {inv.invitedBy}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          isIconOnly
                          size="sm"
                          className="text-danger"
                          isPending={cancelInvitation.isPending}
                          onPress={() =>
                            cancelInvitation.mutate({ invitationId: inv.id })
                          }
                        >
                          <TrashIcon size={16} />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">None.</p>
                  )}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline" onPress={onClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
