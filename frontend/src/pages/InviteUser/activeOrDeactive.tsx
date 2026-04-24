import React, { useCallback, useRef, useState } from "react";
import { FiRefreshCcw, FiShield } from "react-icons/fi";

import {
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  MenuItem,
  ModalOverlay,
} from "@chakra-ui/react";

import { IUser } from ".";
import { useToast } from "../../hooks/toast";
import api from "../../services/api";

// import { Container } from './styles';

type IResetPasswordProps = {
  user: IUser;
  updateUser: (user: IUser) => void;
};

const ActiveOrDeactive: React.FC<IResetPasswordProps> = ({
  user,
  updateUser,
}: IResetPasswordProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const cancelRef = useRef<any>();

  const { addToast } = useToast();

  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  );
  const [overlay, setOverlay] = React.useState(<OverlayOne />);

  const handleChangeStatusPassword = useCallback(async () => {
    try {
      setLoadingSubmit(true);

      const formData = {
        status: user.status === "inactive" ? "active" : "inactive",
      };

      const response = await api.put(`/admin/users/${user.sync_id}`, formData);

      const updatedUserState = {
        ...user,
        status: formData.status,
      } as IUser;

      updateUser(updatedUserState);
      addToast({
        type: "success",
        title: "User status changed",
        description: `User ${user.name} status changed to ${formData.status}`,
      });
      onClose();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error while changing user status",
        description: error.response.data["error" || "message"],
      });
    } finally {
      setLoadingSubmit(false);
    }
  }, [addToast, onClose, updateUser, user]);

  return (
    <>
      <MenuItem
        minH="40px"
        icon={<FiShield size={20} />}
        onClick={() => {
          onOpen();
          setOverlay(<OverlayOne />);
        }}
        isDisabled={
          !["active", "inactive", "confirm_email"].includes(user.status)
        }
      >
        {user.status === "active"
          ? "Deactivate User"
          : user.status === "inactive"
          ? "Activate User"
          : "Deactivate User"}
      </MenuItem>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
        motionPreset={"slideInBottom"}
      >
        {overlay}
        {/* <AlertDialogOverlay> */}
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Reset Password
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to reset the password for user {user.name}?
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              onClick={onClose}
              isDisabled={loadingSubmit}
            >
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={() => handleChangeStatusPassword()}
              ml={3}
              isLoading={loadingSubmit}
              loadingText="Submitting"
            >
              {user.status === "inactive" ? "Activate" : "Deactivate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
        {/* </AlertDialogOverlay> */}
      </AlertDialog>
    </>
  );
};

export default ActiveOrDeactive;
