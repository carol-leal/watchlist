"use client";

import { useEffect, useState } from "react";
import { Modal, Button, toast } from "@heroui/react";
import { api } from "~/trpc/react";

interface EditListModalProps {
  playlistId: string;
  currentName: string;
  currentDescription: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditListModal({
  playlistId,
  currentName,
  currentDescription,
  isOpen,
  onClose,
}: EditListModalProps) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");

  const utils = api.useUtils();

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setDescription(currentDescription ?? "");
    }
  }, [isOpen, currentName, currentDescription]);

  const updatePlaylist = api.playlist.updatePlaylist.useMutation({
    onSuccess: () => {
      toast.success("List updated!");
      void utils.playlist.getBySlug.invalidate();
      void utils.playlist.getUserPlaylists.invalidate();
      onClose();
    },
    onError: (err) => {
      toast.danger(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updatePlaylist.mutate({
      playlistId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit List</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form
                id="edit-list-form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="edit-list-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="edit-list-name"
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
                    htmlFor="edit-list-description"
                    className="text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <textarea
                    id="edit-list-description"
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
              <Button variant="ghost" size="sm" onPress={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-list-form"
                variant="primary"
                size="sm"
                isDisabled={!name.trim() || updatePlaylist.isPending}
                isPending={updatePlaylist.isPending}
              >
                Save
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
