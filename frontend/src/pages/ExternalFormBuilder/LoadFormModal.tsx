import { useCallback, useRef, useState } from "react";

import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { FormHandles } from "@unform/core";
import { Form } from "@unform/web";

import TextArea from "../../components/TextArea";
import { useToast } from "../../hooks/toast";

type Props = {
  loadFormJSON: (formJSON: string) => void;
};

const LoadFormModal = ({ loadFormJSON }: Props) => {
  const OverlayOne = () => (
    <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
  );

  const formRef = useRef<FormHandles>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [overlay, setOverlay] = useState(<OverlayOne />);

  const { addToast } = useToast();

  const handleSubmit = useCallback(
    (data: any) => {
      try {
        loadFormJSON(JSON.parse(data.formJSON));
        onClose();
      } catch (err: any) {
        addToast({
          title: "Invalid JSON",
          description: `ERROR: ${err}`,
          type: "error",
        });
      }
    },
    [loadFormJSON, addToast, onClose]
  );

  return (
    <VStack flex={1}>
      <Button
        onClick={() => {
          setOverlay(<OverlayOne />);
          onOpen();
        }}
        style={{
          background: "transparent",
          border: "1px solid rgb(0, 0, 125)",
          color: "rgb(0, 0, 125)",
          width: "100%",
          marginTop: "1rem",
          height: "3rem",
        }}
      >
        Load Form JSON
      </Button>

      <Modal size={"3xl"} isCentered isOpen={isOpen} onClose={onClose}>
        {overlay}
        <ModalContent>
          <ModalHeader>Load Form JSON</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Instructions: Copy the JSON String structure of a form and paste
              it here.
            </Text>
            <Form ref={formRef} onSubmit={handleSubmit}>
              <TextArea
                name="formJSON"
                placeholder="Paste JSON FORM Structure here"
              />
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="teal"
              onClick={() => formRef.current?.submitForm()}
            >
              Load
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default LoadFormModal;
