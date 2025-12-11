import { useState } from "react";
import {
  Box,
  Center,
  SimpleGrid,
  VStack,
  Text,
  Button,
  HStack,
  Spinner,
} from "@chakra-ui/react";

type GameProps = {
  player1: string;
  player2: string;
};

const ROWS = 6;
const COLS = 7;

export default function Game2({ player1, player2 }: GameProps) {
  const [board, setBoard] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [current, setCurrent] = useState<"red" | "yellow">("red");
  const [winner, setWinner] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ------------ HANDLE MOVE (REST API) ------------
  const dropPiece = async (col: number) => {
    // If game is over, restart on any click
    if (winner) {
      restartMatch();
      return;
    }
    
    if (isProcessing) return; // Prevent moves while processing

    setIsProcessing(true);
    try {
      const response = await fetch("/api/game2/move", {
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

      // Check for winner
      if (data.hasWinner && data.winnerColor) {
        const winnerName = data.winnerColor === "red" ? player1 : player2;
        setWinner(winnerName);
        // Don't open modal, just set winner - clicking board will restart
      } else {
        // Switch turns if no winner
        setCurrent(current === "red" ? "yellow" : "red");
      }
    } catch (error) {
      console.error("Failed to process move:", error);
      alert("Failed to process move. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ------------ RESTART (same players) ------------
  const restartMatch = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setCurrent("red");
    setWinner("");
  };

  return (
    <Center minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={6}>
        <Text fontSize="5xl" fontWeight="bold">Connect-X</Text>

        <HStack spacing={4}>
          {winner ? (
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {winner} wins! Click anywhere on the board to restart
            </Text>
          ) : (
            <>
              <Text fontSize="2xl" fontWeight="semibold">
                Turn: {current === "red" ? player1 : player2}
              </Text>
              {isProcessing && <Spinner size="sm" />}
            </>
          )}
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
                    cursor={isProcessing ? "not-allowed" : "pointer"}
                    onClick={() => dropPiece(cIndex)}
                    transition="0.2s"
                    opacity={isProcessing ? 0.6 : winner ? 0.8 : 1}
                    _hover={!isProcessing ? { transform: "scale(1.05)", opacity: 1 } : {}}
                    title={winner ? "Click to restart game" : ""}
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
          </VStack>
        </HStack>

        {/* Restart Button (full game reset) */}
        <Button colorScheme="gray" variant="outline" w="200px" onClick={() => window.location.reload()}>
          New Game
        </Button>
      </VStack>

    </Center>
  );
}
