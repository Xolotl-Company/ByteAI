import {
  AbsoluteCenter,
  Box,
  Circle,
  Flex,
  HStack,
  IconButton,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Tooltip } from './components/ui/tooltip';
import {
  ExploreGPTIcon,
  NewChatIcon,
  SidebarIcon,
  SmallGPTIcon,
  UpgradeIcon,
} from './icons/sidebar-icons';
import  { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaBoxOpen } from 'react-icons/fa';

import { useSidebarContext } from './sidebar-context';

export function Sidebar() {
  const { sideBarVisible, toggleSidebar } = useSidebarContext();
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedChats, setArchivedChats] = useState<{ id: string; title: string }[]>([]);

  // Cargar chats desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem('byte-chats');
    if (stored) {
      setChats(JSON.parse(stored));
    }
  }, []);

  // Guardar chats en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('byte-chats', JSON.stringify(chats));
  }, [chats]);

  // Crear un nuevo chat
  const handleNewChat = () => {
    const newId = uuidv4();
    const newTitle = `Nuevo chat ${chats.length + 1}`;
    const newChat = { id: newId, title: newTitle };
    setChats([newChat, ...chats]);
    setSelectedChat(newId);
    // Limpiar historial del chat en localStorage para el nuevo chat
    localStorage.setItem('byte-chat-history', JSON.stringify([]));
    // Opcional: podrías emitir un evento global aquí
    window.dispatchEvent(new CustomEvent('byte-chat-selected', { detail: { id: newId } }));
  };

  // Seleccionar chat
  const handleSelectChat = (id: string) => {
    setSelectedChat(id);
    // Cargar historial de ese chat
    const chatHistory = localStorage.getItem(`byte-chat-history-${id}`);
    if (chatHistory) {
      localStorage.setItem('byte-chat-history', chatHistory);
    } else {
      localStorage.setItem('byte-chat-history', JSON.stringify([]));
    }
    window.dispatchEvent(new CustomEvent('byte-chat-selected', { detail: { id } }));
  };

  // Guardar historial de cada chat cuando cambie el historial global
  useEffect(() => {
    if (selectedChat) {
      const chatHistory = localStorage.getItem('byte-chat-history');
      if (chatHistory) {
        localStorage.setItem(`byte-chat-history-${selectedChat}`, chatHistory);
      }
    }
  }, [selectedChat]);

  // Recibir cambios de chats desde MiddleSection
  useEffect(() => {
    const updateChats = () => {
      const stored = localStorage.getItem('byte-chats');
      setChats(stored ? JSON.parse(stored) : []);
    };
    window.addEventListener('byte-chat-selected', updateChats);
    window.addEventListener('storage', updateChats);
    return () => {
      window.removeEventListener('byte-chat-selected', updateChats);
      window.removeEventListener('storage', updateChats);
    };
  }, []);

  // Cargar chats archivados
  useEffect(() => {
    const stored = localStorage.getItem('byte-archived-chats');
    setArchivedChats(stored ? JSON.parse(stored) : []);
  }, []);

  // Actualizar chats archivados cuando se archiva/desarchiva
  useEffect(() => {
    const updateArchived = () => {
      const stored = localStorage.getItem('byte-archived-chats');
      setArchivedChats(stored ? JSON.parse(stored) : []);
    };
    window.addEventListener('byte-chat-selected', updateArchived);
    window.addEventListener('storage', updateArchived);
    return () => {
      window.removeEventListener('byte-chat-selected', updateArchived);
      window.removeEventListener('storage', updateArchived);
    };
  }, []);

  // Desarchivar chat
  const handleUnarchive = (id: string) => {
    const archived = archivedChats.filter(c => c.id !== id);
    const chatToRestore = archivedChats.find(c => c.id === id);
    if (chatToRestore) {
      setChats([chatToRestore, ...chats]);
      localStorage.setItem('byte-chats', JSON.stringify([chatToRestore, ...chats]));
      localStorage.setItem('byte-archived-chats', JSON.stringify(archived));
      setArchivedChats(archived);
      window.dispatchEvent(new CustomEvent('byte-chat-selected', { detail: { id } }));
    }
  };

  return (
    <Box
      bg='bg.muted'
      w={!sideBarVisible ? '0' : '260px'}
      overflow='hidden'
      transition=' width 0.3s'
    >
      <Stack h='full' px='3' py='2'>
        <Flex justify='space-between'>
          <Tooltip
            content='Close sidebar'
            positioning={{ placement: 'right' }}
            showArrow
          >
            <IconButton variant='ghost' onClick={toggleSidebar}>
              <SidebarIcon fontSize='2xl' color='fg.muted' />
            </IconButton>
          </Tooltip>

          <Tooltip content='New chat' showArrow>
            <IconButton variant='ghost' onClick={handleNewChat}>
              <NewChatIcon fontSize='2xl' color='fg.muted' />
            </IconButton>
          </Tooltip>
        </Flex>

        <Stack px='2' gap='0' flex='1'>
          <HStack
            position='relative'
            className='group'
            _hover={{
              layerStyle: 'fill.muted',
              textDecor: 'none',
            }}
            px='1'
            h='10'
            borderRadius='lg'
            w='100%'
            whiteSpace='nowrap'
          >
            <Link href='#' variant='plain' _hover={{ textDecor: 'none' }}>
              <Circle size='6' bg='bg' borderWidth='1px'>
                <SmallGPTIcon fontSize='md' />
              </Circle>
              <Text fontSize='sm' fontWeight='md'>
                Byte
              </Text>
            </Link>
            <AbsoluteCenter
              axis='vertical'
              right='2'
              display='none'
              _groupHover={{ display: 'initial' }}
            >
              <Tooltip
                content='New chat'
                positioning={{ placement: 'right' }}
                showArrow
              >
                <NewChatIcon
                  fontSize='md'
                  color='fg.subtle'
                  _hover={{ color: 'fg.muted' }}
                />
              </Tooltip>
            </AbsoluteCenter>
          </HStack>

          <HStack
            _hover={{
              layerStyle: 'fill.muted',
              textDecor: 'none',
            }}
            px='1'
            h='10'
            borderRadius='lg'
            w='100%'
            whiteSpace='nowrap'
          >
            <Link href='#' variant='plain' _hover={{ textDecor: 'none' }}>
              <ExploreGPTIcon fontSize='md' />

              <Text fontSize='sm' fontWeight='md'>
                Explore GPTs
              </Text>
            </Link>
          </HStack>

          {/* Sección de chats */}
          <Box mt='4'>
            <Text fontSize='xs' color='fg.subtle' fontWeight='bold' mb='2' px='2'>
              Chats
            </Text>
            <Stack gap='1' px='2'>
              {chats.length === 0 && (
                <Text fontSize='xs' color='fg.muted'>No hay chats aún</Text>
              )}
              {chats.map(chat => (
                <Link
                  key={chat.id}
                  href="#"
                  variant="plain"
                  _hover={{ textDecor: 'none', bg: 'bg.subtle' }}
                  bg={selectedChat === chat.id ? 'bg.subtle' : undefined}
                  borderRadius="md"
                  px="2"
                  py="1"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <Text fontSize="sm" truncate>{chat.title}</Text>
                </Link>
              ))}
            </Stack>
            {archivedChats.length > 0 && (
              <>
                <Text
                  fontSize='xs'
                  color='fg.subtle'
                  fontWeight='bold'
                  mt='4'
                  px='2'
                  as='button'
                  style={{ cursor: 'pointer', textAlign: 'left', width: '100%', background: 'none', border: 'none' }}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? 'Ocultar chats archivados' : 'Chats archivados'}
                </Text>
                {showArchived && (
                  <Stack gap='1' px='2' mt='2'>
                    {archivedChats.map(chat => (
                      <HStack key={chat.id} justify='space-between'>
                        <Text fontSize='sm' truncate>{chat.title}</Text>
                        <Text
                          fontSize='xs'
                          color='blue.400'
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => handleUnarchive(chat.id)}
                        >
                          Desarchivar
                        </Text>
                      </HStack>
                    ))}
                  </Stack>
                )}
              </>
            )}
          </Box>
        </Stack>

        <Link
          href='#'
          _hover={{ textDecor: 'none', layerStyle: 'fill.muted' }}
          borderRadius='lg'
          px='1'
          py='2'
        >
          <HStack whiteSpace='nowrap'>
            <Circle size='8' fontSize='lg' borderWidth='1px'>
              <UpgradeIcon />
            </Circle>
            <Stack gap='0' fontWeight='medium'>
              <Text fontSize='sm'>Upgrade plan</Text>
              <Text fontSize='xs' color='fg.subtle'>
                Accede a un mejor modelo
              </Text>
            </Stack>
          </HStack>
        </Link>
      </Stack>
    </Box>
  );
}
