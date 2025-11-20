import { useState } from "react";
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

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [winner, setWinner] = useState<string>("");

  // ------------ WIN CHECKING ------------
  const checkWin = (board: string[][]): string | null => {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal down-right
      [1, -1], // diagonal down-left
    ];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board[r][c];
        if (!color) continue;

        for (const [dr, dc] of directions) {
          let streak = 1;

          for (let k = 1; k < 4; k++) {
            const nr = r + dr * k;
            const nc = c + dc * k;

            if (
              nr < 0 ||
              nr >= ROWS ||
              nc < 0 ||
              nc >= COLS ||
              board[nr][nc] !== color
            ) {
              break;
            }

            streak++;
          }

          if (streak === 4) return color;
        }
      }
    }
    return null;
  };

  // ------------ HANDLE MOVE ------------
  const dropPiece = (col: number) => {
    const newBoard = board.map((row) => [...row]);

    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = current;
        break;
      }
    }

    const win = checkWin(newBoard);
    if (win) {
      setWinner(win === "red" ? player1 : player2);
      setBoard(newBoard);
      onOpen();
      return;
    }

    setBoard(newBoard);
    setCurrent(current === "red" ? "yellow" : "red");
  };

  // ------------ RESTART (same players) ------------
  const restartMatch = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
    setCurrent("red");
    setWinner("");
    onClose();
  };

  return (
    <Center minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={6}>
        <Text fontSize="5xl" fontWeight="bold">Connect-X</Text>

        <Text fontSize="2xl" fontWeight="semibold">
          Turn: {current === "red" ? player1 : player2}
        </Text>

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
                    cursor="pointer"
                    onClick={() => dropPiece(cIndex)}
                    transition="0.2s"
                    _hover={{ transform: "scale(1.05)" }}
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
