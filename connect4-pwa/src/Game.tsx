import { useState, useEffect } from "react";
import {
  Box,
  Center,
  SimpleGrid,
  VStack,
  Text,
  Button,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";

type GameProps = {
  player1: string;
  player2: string;
};

const ROWS = 6;
const COLS = 7;

export default function Game({ player1, player2 }: GameProps) {
  const [board, setBoard] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [current, setCurrent] = useState<"red" | "yellow">("red");
  const [scores, setScores] = useState({ red: 0, yellow: 0 });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [winner, setWinner] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ------------ HANDLE MOVE (REST API) ------------
  const dropPiece = async (col: number) => {
    if (isProcessing || winner) return; // Prevent moves while processing or if game is over

    setIsProcessing(true);
    try {
      const response = await fetch("/api/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrix: board,
          currentPlayer: current,
          column: col,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to process move");
        setIsProcessing(false);
        return;
      }

      const data = await response.json();
      
      // Update board with the new matrix from backend
      setBoard(data.matrix);

      // Update scores
      if (data.scores) {
        setScores((prevScores) => ({
          red: prevScores.red + (data.scores.red || 0),
          yellow: prevScores.yellow + (data.scores.yellow || 0),
        }));
      }

      // Switch turns
      setCurrent(current === "red" ? "yellow" : "red");
    } catch (error) {
      console.error("Failed to process move:", error);
      alert("Failed to process move. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // If board becomes full and there is no score/winner, treat as a draw and end the game
  useEffect(() => {
    if (!board || !board[0]) return;
    const boardFull = board[0].every((cell) => cell !== "");
    if (boardFull && !winner) {
      setWinner("Draw");
      onOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // ------------ RESTART (same players) ------------
  const restartMatch = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setCurrent("red");
    setWinner("");
    setScores({ red: 0, yellow: 0 });
    onClose();
  };

  return (
    <Center minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={6}>
        <Text fontSize="5xl" fontWeight="bold">Connect-X</Text>

        <HStack spacing={4}>
          <Text fontSize="2xl" fontWeight="semibold">
            Turn: {current === "red" ? player1 : player2}
          </Text>
          {isProcessing && <Spinner size="sm" />}
        </HStack>

        <HStack spacing={12}>
          {/* Player 1 */}
          <VStack>
            <Text fontSize="3xl" fontWeight="bold">1</Text>
            <Box
              w="70px"
              h="70px"
              borderRadius="full"
              bg="red.400"
              border="4px solid white"
            />
            <Text fontSize="lg" color="red.500">{player1}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="red.600">
              Score: {scores.red}
            </Text>
          </VStack>

          {/* GAME BOARD */}
          <Box
            bg="blue.700"
            p={6}
            borderRadius="20px"
            boxShadow="xl"
          >
            <SimpleGrid columns={COLS} spacing={4}>
              {board.map((row, rIndex) =>
                row.map((cell, cIndex) => (
                  <Box
                    key={`${rIndex}-${cIndex}`}
                    w="70px"
                    h="70px"
                    bg={cell === "red" ? "red.400" : cell === "yellow" ? "yellow.300" : "white"}
                    borderRadius="full"
                    border="4px solid white"
                    cursor={isProcessing || winner ? "not-allowed" : "pointer"}
                    onClick={() => dropPiece(cIndex)}
                    transition="0.2s"
                    opacity={isProcessing ? 0.6 : 1}
                    _hover={!isProcessing && !winner ? { transform: "scale(1.05)" } : {}}
                  />
                ))
              )}
            </SimpleGrid>
          </Box>

          {/* Player 2 */}
          <VStack>
            <Text fontSize="3xl" fontWeight="bold">2</Text>
            <Box
              w="70px"
              h="70px"
              borderRadius="full"
              bg="yellow.300"
              border="4px solid white"
            />
            <Text fontSize="lg" color="yellow.600">{player2}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
              Score: {scores.yellow}
            </Text>
          </VStack>
        </HStack>

        {/* Restart Button (full game reset) */}
        <Button colorScheme="gray" variant="outline" w="200px" onClick={() => window.location.reload()}>
          New Game
        </Button>
      </VStack>

      {/* WINNER MODAL */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🎉 We have a winner!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="2xl" textAlign="center" fontWeight="bold">
              {winner} wins!
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={restartMatch}>
              Restart Match
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              New Game
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}
