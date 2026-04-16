"use client";

import { useState } from "react";
import { Modal, Button, toast } from "@heroui/react";
import { PopcornIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewListModal({ isOpen, onClose }: NewListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const router = useRouter();
  const utils = api.useUtils();

  const createPlaylist = api.playlist.create.useMutation({
    onSuccess: () => {
      toast.success("List created!");
      void utils.playlist.getUserPlaylists.invalidate();
      router.refresh();
      resetAndClose();
    },
    onError: (err) => {
      toast.danger(err.message);
    },
  });

  const resetAndClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createPlaylist.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) resetAndClose();
        }}
      >
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>New List</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form
                id="new-list-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                {/* Preview */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-default">
                    <PopcornIcon size={28} className="text-muted" />
                  </div>
                  <p className="text-sm text-muted">
                    {name.trim() || "Your new list"}
                  </p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="list-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="list-name"
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Weekend Binge"
                    className="rounded-lg border border-separator bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="list-description"
                    className="text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <textarea
                    id="list-description"
                    maxLength={500}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this list about?"
                    className="resize-none rounded-lg border border-separator bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" size="sm" onPress={resetAndClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="new-list-form"
                variant="primary"
                size="sm"
                isDisabled={!name.trim() || createPlaylist.isPending}
                isPending={createPlaylist.isPending}
              >
                Create List
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
