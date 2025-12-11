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
  HStack,
} from "@chakra-ui/react";
import Game from "./Game";
import Game2 from "./Game2";

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedGame, setSelectedGame] = useState<"game1" | "game2" | null>(null);

  const startGame = () => {
    if (!player1 || !player2) return alert("Enter both names!");
    setGameStarted(true);
    onClose();
  };

  const handleGameSelection = (game: "game1" | "game2") => {
    setSelectedGame(game);
    onOpen();
  };

  // Show game after starting
  if (gameStarted && selectedGame === "game1") {
    return <Game player1={player1} player2={player2} />;
  }

  if (gameStarted && selectedGame === "game2") {
    return <Game2 player1={player1} player2={player2} />;
  }

  return (
    <Center minH="100vh" bg="gray.50">
      <VStack spacing={6}>
        <Heading size="3xl" fontWeight="bold">
          Connect-X
        </Heading>

        <HStack spacing={4}>
          <Button colorScheme="blue" size="lg" onClick={() => handleGameSelection("game1")}>
            Game 1
          </Button>
          <Button colorScheme="green" size="lg" onClick={() => handleGameSelection("game2")}>
            Game 2
          </Button>
        </HStack>
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
