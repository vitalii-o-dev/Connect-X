import { useState, useEffect, useRef } from "react";
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
  Divider,
} from "@chakra-ui/react";
import { saveGameStats, getGameStatsForPlayers } from "./statistics";
import type { GameStats } from "./statistics";

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
  const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
  const [winner, setWinner] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameStats[]>([]);
  const hasSavedStatsRef = useRef(false);

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

  // ------------ CHECK IF BOARD IS FULL ------------
  const isBoardFull = () => {
    return board[0].every((cell) => cell !== "");
  };

  // ------------ SAVE STATISTICS WHEN GAME ENDS ------------
  const saveCurrentGameStats = () => {
    const stats: GameStats = {
      player1,
      player2,
      gameType: "game1",
      timestamp: Date.now(),
      player1Score: scores.red,
      player2Score: scores.yellow,
    };
    saveGameStats(stats);
    // Update local history
    const history = getGameStatsForPlayers(player1, player2, "game1");
    setGameHistory(history);
  };

  // ------------ RESTART (same players) ------------
  const restartMatch = () => {
    // Save stats before resetting if there were scores and stats haven't been saved
    if ((scores.red > 0 || scores.yellow > 0) && !hasSavedStatsRef.current) {
      saveCurrentGameStats();
      hasSavedStatsRef.current = true;
      // Show statistics modal
      onStatsOpen();
      return; // Don't reset yet, let user see stats first
    }
    // Reset the game
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setCurrent("red");
    setWinner("");
    setScores({ red: 0, yellow: 0 });
    hasSavedStatsRef.current = false;
    onClose();
    onStatsClose();
  };

  // Check for board full condition after each move
  useEffect(() => {
    if (!board || !board[0]) return;
    const boardFull = board[0].every((cell) => cell !== "");
    if (boardFull && !winner && !hasSavedStatsRef.current && (scores.red > 0 || scores.yellow > 0)) {
      // Board is full, game ends - save stats and show statistics
      const stats: GameStats = {
        player1,
        player2,
        gameType: "game1",
        timestamp: Date.now(),
        player1Score: scores.red,
        player2Score: scores.yellow,
      };
      saveGameStats(stats);
      hasSavedStatsRef.current = true;
      const history = getGameStatsForPlayers(player1, player2, "game1");
      setGameHistory(history);
      onStatsOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // Load game history on mount and when stats are saved
  useEffect(() => {
    try {
      const history = getGameStatsForPlayers(player1, player2, "game1");
      setGameHistory(history);
    } catch (error) {
      console.error("Failed to load game history:", error);
      setGameHistory([]);
    }
  }, [player1, player2, isStatsOpen]);

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

      {/* STATISTICS MODAL - Shows when game ends */}
      <Modal isOpen={isStatsOpen} onClose={onStatsClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>📊 Game Statistics</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Current Game Score */}
              <Box>
                <Text fontSize="xl" fontWeight="bold" mb={2}>
                  Current Game Score
                </Text>
                <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="semibold" color="red.600">{player1}:</Text>
                  <Text fontSize="lg" fontWeight="bold">{scores.red}</Text>
                </HStack>
                <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md" mt={2}>
                  <Text fontWeight="semibold" color="yellow.600">{player2}:</Text>
                  <Text fontSize="lg" fontWeight="bold">{scores.yellow}</Text>
                </HStack>
              </Box>

              {/* Previous Games */}
              {gameHistory.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Text fontSize="xl" fontWeight="bold" mb={2}>
                      Previous Games ({gameHistory.length})
                    </Text>
                    <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                      {gameHistory.slice().reverse().map((game, index) => (
                        <Box key={index} p={3} bg="gray.50" borderRadius="md">
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm" color="gray.600">
                              Game {gameHistory.length - index} - {new Date(game.timestamp).toLocaleString()}
                            </Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="red.600">{game.player1}:</Text>
                            <Text fontWeight="bold">{game.player1Score || 0}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="yellow.600">{game.player2}:</Text>
                            <Text fontWeight="bold">{game.player2Score || 0}</Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </>
              )}

              {gameHistory.length === 0 && (
                <Text color="gray.500" textAlign="center" py={4}>
                  No previous games recorded
                </Text>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={restartMatch}>
              Restart Match
            </Button>
            <Button colorScheme="blue" onClick={onStatsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}
