import { useState, useEffect, useRef } from "react";
import {
  Box,
  Center,
  SimpleGrid,
  VStack,
  Text,
  Button,
  HStack,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
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

export default function Game2({ player1, player2 }: GameProps) {
  const [board, setBoard] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [current, setCurrent] = useState<"red" | "yellow">("red");
  const [winner, setWinner] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
  const [gameHistory, setGameHistory] = useState<GameStats[]>([]);
  const hasSavedStatsRef = useRef(false);

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
        // Save statistics when game ends
        if (!hasSavedStatsRef.current) {
          const stats: GameStats = {
            player1,
            player2,
            gameType: "game2",
            timestamp: Date.now(),
            winner: winnerName,
          };
          saveGameStats(stats);
          hasSavedStatsRef.current = true;
          // Update local history
          const history = getGameStatsForPlayers(player1, player2, "game2");
          setGameHistory(history);
          // Show statistics modal
          onStatsOpen();
        }
      } else {
        // Switch turns if no winner
        setCurrent(current === "red" ? "yellow" : "red");
      }

      // If backend indicates board is full and there's no winner, treat as draw: save stats and open modal
      const boardFull = data.boardFull ?? (data.matrix && data.matrix[0] ? data.matrix[0].every((cell: any) => cell !== '') : false);
      if (!data.hasWinner && boardFull && !hasSavedStatsRef.current) {
        setWinner("Draw"); // Set winner to "Draw" to stop accepting moves
        const stats: GameStats = {
          player1,
          player2,
          gameType: "game2",
          timestamp: Date.now(),
          // No winner field means it's a draw
        };
        saveGameStats(stats);
        hasSavedStatsRef.current = true;
        const history = getGameStatsForPlayers(player1, player2, "game2");
        setGameHistory(history);
        onStatsOpen();
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
    hasSavedStatsRef.current = false;
    onStatsClose();
  };

  // Load game history on mount
  useEffect(() => {
    const history = getGameStatsForPlayers(player1, player2, "game2");
    setGameHistory(history);
  }, [player1, player2, isStatsOpen]);

  return (
    <Center minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={6}>
        <Text fontSize="5xl" fontWeight="bold">Connect-X</Text>

        <HStack spacing={4}>
          {winner ? (
            <Text fontSize="2xl" fontWeight="bold" color={winner === "Draw" ? "gray.500" : "green.500"}>
              {winner === "Draw" ? "🤝 It's a Draw! Click anywhere on the board to restart" : `${winner} wins! Click anywhere on the board to restart`}
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

      {/* STATISTICS MODAL - Shows when game ends */}
      <Modal isOpen={isStatsOpen} onClose={onStatsClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>📊 Game Statistics</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Current Game Result */}
              {winner && (
                <Box>
                  <Text fontSize="xl" fontWeight="bold" mb={2}>
                    Current Game Result
                  </Text>
                  {winner === "Draw" ? (
                    <Text fontSize="2xl" textAlign="center" fontWeight="bold" color="gray.600" p={3} bg="gray.50" borderRadius="md">
                      🤝 Draw
                    </Text>
                  ) : (
                    <Text fontSize="2xl" textAlign="center" fontWeight="bold" color="green.600" p={3} bg="green.50" borderRadius="md">
                      🎉 {winner} wins!
                    </Text>
                  )}
                </Box>
              )}

              {/* Previous Games */}
              {gameHistory.length > 0 && (
                <>
                  {winner && <Divider />}
                  <Box>
                    <Text fontSize="xl" fontWeight="bold" mb={2}>
                      Previous Games ({gameHistory.length})
                    </Text>
                    <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                      {gameHistory.slice().reverse().map((game, index) => {
                        const isPlayer1Winner = game.winner === game.player1;
                        const isPlayer2Winner = game.winner === game.player2;
                        const isDraw = !game.winner;
                        return (
                          <Box key={index} p={3} bg="gray.50" borderRadius="md">
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="sm" color="gray.600">
                                Game {gameHistory.length - index} - {new Date(game.timestamp).toLocaleString()}
                              </Text>
                            </HStack>

                            {isDraw && (
                              <Text textAlign="center" color="gray.600" mb={2}>
                                Draw
                              </Text>
                            )}

                            <HStack justify="space-between">
                              <Text fontSize="sm" color={isPlayer1Winner ? "green.600" : "gray.600"} fontWeight={isPlayer1Winner ? "bold" : "normal"}>
                                {game.player1}
                              </Text>
                              <Text fontSize="sm" fontWeight="bold" color={isPlayer1Winner ? "green.600" : "gray.400"}>
                                {isPlayer1Winner ? "🏆 Winner" : "—"}
                              </Text>
                            </HStack>
                            <HStack justify="space-between" mt={1}>
                              <Text fontSize="sm" color={isPlayer2Winner ? "green.600" : "gray.600"} fontWeight={isPlayer2Winner ? "bold" : "normal"}>
                                {game.player2}
                              </Text>
                              <Text fontSize="sm" fontWeight="bold" color={isPlayer2Winner ? "green.600" : "gray.400"}>
                                {isPlayer2Winner ? "🏆 Winner" : "—"}
                              </Text>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                </>
              )}

              {gameHistory.length === 0 && !winner && (
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
