import React, { useState } from "react";
import * as Yup from "yup";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  VStack,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";

import api from "../../services/api";
import { IConversationItem } from "./types";

// Match the account's existing plus-alias identity semantics for early UX errors.
const canonicalEmail = (email: string) =>
  email
    .trim()
    .replace(/(\+.*)(?=\@)/, "")
    .toLocaleLowerCase();
export function messengerError(error: any): string {
  if (error.response?.data?.message) return error.response.data.message;
  const validation = error.response?.data?.validation;
  if (validation)
    return Object.values(validation)
      .map((item: any) => item.message)
      .join("; ");
  return "Unable to complete the request. Please try again.";
}

export default function CreateGroupDialog({
  onClose,
  onCreated,
  creatorEmail,
}: {
  onClose: () => void;
  onCreated: (conversation: IConversationItem) => void;
  creatorEmail: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const add = () => {
    const value = email.trim();
    if (!Yup.string().required().email().isValidSync(value)) {
      setError("Enter a valid email address.");
      return;
    }
    const canonical = canonicalEmail(value);
    if (canonical === canonicalEmail(creatorEmail)) {
      setError("You are included automatically.");
      return;
    }
    if (emails.includes(canonical)) {
      setError("That participant is already added.");
      return;
    }
    if (emails.length >= 49) {
      setError("A group can include up to 49 other participants.");
      return;
    }
    setEmails([...emails, canonical]);
    setEmail("");
    setError("");
  };
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a group name.");
      return;
    }
    if (email.trim()) {
      setError("Add the pending email address before creating the group.");
      return;
    }
    if (emails.length < 2) {
      setError("Add at least two other participants.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post<IConversationItem>(
        "/conversations/group",
        { name: name.trim(), emails }
      );
      onCreated(data);
    } catch (err) {
      setError(messengerError(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={create}>
        <ModalHeader>Create Group</ModalHeader>
        <ModalCloseButton isDisabled={saving} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel htmlFor="group-name">Group name</FormLabel>
              <Input
                id="group-name"
                value={name}
                maxLength={100}
                isDisabled={saving}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="group-email">Member email</FormLabel>
              <HStack>
                <Input
                  id="group-email"
                  value={email}
                  placeholder="email@example.com"
                  isDisabled={saving}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                />
                <Button type="button" onClick={add} isDisabled={saving}>
                  Add
                </Button>
              </HStack>
            </FormControl>
            <Text fontSize="sm">
              You are included automatically. Add at least two active DAppGenius
              users.
            </Text>
            <Wrap>
              {emails.map((value) => (
                <WrapItem key={value}>
                  <Tag>
                    <TagLabel>{value}</TagLabel>
                    <TagCloseButton
                      aria-label={`Remove ${value}`}
                      isDisabled={saving}
                      onClick={() =>
                        setEmails(emails.filter((item) => item !== value))
                      }
                    />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
            {error && (
              <Text role="alert" color="red.600">
                {error}
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button type="button" onClick={onClose} isDisabled={saving}>
            Cancel
          </Button>
          <Button type="submit" colorScheme="blue" isLoading={saving}>
            Create Group
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
