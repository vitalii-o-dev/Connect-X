import { useState } from "react";
import {
  Button,
  VStack,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  Heading,
} from "@chakra-ui/react";

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");

  const startGame = () => {
    if (!player1 || !player2) return alert("Enter both names!");
    console.log("Start game with:", player1, player2);
    onClose();
  };

  return (
    <Center minH="100vh" bg="gray.50">
      <VStack spacing={6}>
        <Heading size="3xl" fontWeight="bold">
          Connect-X
        </Heading>

        <Button colorScheme="blue" size="lg" onClick={onOpen}>
          Play
        </Button>
      </VStack>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enter Player Names</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Input
                placeholder="Player 1"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
              />
              <Input
                placeholder="Player 2"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={startGame}>
              Start Game
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}

export default App;
