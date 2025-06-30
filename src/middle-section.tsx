import {
  Center,
  Heading,
  HStack,
  IconButton,
  Input,
  VStack,
  chakra,
} from '@chakra-ui/react';
import {
  FileUploadList,
  FileUploadRoot,
  FileUploadTrigger,
} from './components/ui/file-button';
import { InputGroup } from './components/ui/input-group';
import {
  UploadIcon,
} from './icons/other-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { keyframes } from '@emotion/react';
import { FaTrash, FaArrowRight, FaArrowUp, FaArchive, FaShareAlt, FaPencilAlt } from 'react-icons/fa';


interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
}

function PromptButton(props: PromptButtonProps & { onClick?: () => void }) {
  const { icon, description, onClick } = props;
  return (
    <Button variant='outline' borderRadius='full' onClick={onClick}>
      {icon}
      <chakra.span color='fg.subtle'>{description}</chakra.span>
    </Button>
  );
}

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Animación de aparición tipo ChatGPT
const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Animación de transición tipo ChatGPT para el historial
const slideChat = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

export function MiddleSection() {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    // Recuperar historial guardado en localStorage
    const saved = localStorage.getItem('byte-chat-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(chatHistory.length === 0);
  const chatListRef = useRef<HTMLDivElement>(null);

  const handleInputValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Manejar cambio de chat desde el sidebar
  useEffect(() => {
    const handler = (e: any) => {
      // Cuando se selecciona un chat, recargar el historial
      const id = e.detail?.id;
      if (id) {
        const chatHistory = localStorage.getItem(`byte-chat-history-${id}`);
        setChatHistory(chatHistory ? JSON.parse(chatHistory) : []);
        setShowWelcome((chatHistory ? JSON.parse(chatHistory) : []).length === 0);
      }
    };
    window.addEventListener('byte-chat-selected', handler);
    return () => window.removeEventListener('byte-chat-selected', handler);
  }, []);

  // Cuando se crea un nuevo chat, limpiar el historial y mostrar pantalla de bienvenida
  useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail?.id;
      if (id) {
        // Si el historial está vacío, mostrar bienvenida
        const chatHistory = localStorage.getItem(`byte-chat-history-${id}`);
        setShowWelcome(!(chatHistory && JSON.parse(chatHistory).length > 0));
      }
    };
    window.addEventListener('byte-chat-selected', handler);
    return () => window.removeEventListener('byte-chat-selected', handler);
  }, []);

  // Guardar historial de chat actual bajo su id
  useEffect(() => {
    const currentId = (() => {
      const chats = localStorage.getItem('byte-chats');
      const selected = chats ? JSON.parse(chats)[0]?.id : null;
      return selected;
    })();
    if (currentId) {
      localStorage.setItem(`byte-chat-history-${currentId}`, JSON.stringify(chatHistory));
    }
    localStorage.setItem('byte-chat-history', JSON.stringify(chatHistory));
    setShowWelcome(chatHistory.length === 0);
    // Deslizar hacia abajo cuando se agrega un mensaje
    if (chatListRef.current && chatHistory.length > 0) {
      chatListRef.current.scrollTo({
        top: chatListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatHistory]);

  // Nuevo: crear chat automáticamente al primer mensaje
  useEffect(() => {
    if (chatHistory.length === 1 && chatHistory[0].role === 'user') {
      // Si no hay chats, crea uno nuevo
      let chats = localStorage.getItem('byte-chats');
      let chatsArr = chats ? JSON.parse(chats) : [];
      if (!chatsArr.length) {
        const newId = crypto.randomUUID();
        // El título será el primer mensaje del usuario (recortado)
        const newTitle = chatHistory[0].content.slice(0, 30) + (chatHistory[0].content.length > 30 ? '...' : '');
        const newChat = { id: newId, title: newTitle };
        chatsArr = [newChat];
        localStorage.setItem('byte-chats', JSON.stringify(chatsArr));
        window.dispatchEvent(new CustomEvent('byte-chat-selected', { detail: { id: newId } }));
        window.dispatchEvent(new Event('byte-chat-title-updated'));
      } else if (!chatsArr[0].title || chatsArr[0].title.startsWith('Nuevo chat')) {
        // Si el chat existe pero tiene título genérico, actualiza el título
        chatsArr[0].title = chatHistory[0].content.slice(0, 30) + (chatHistory[0].content.length > 30 ? '...' : '');
        localStorage.setItem('byte-chats', JSON.stringify(chatsArr));
        window.dispatchEvent(new Event('byte-chat-title-updated'));
      }
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const newHistory = [
      ...chatHistory,
      { role: 'user' as const, content: inputValue }
    ];
    setChatHistory(newHistory);
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory })
      });
      const data = await response.json();
      const aiMsg = data.choices?.[0]?.message?.content || 'Sin respuesta';
      setChatHistory([...newHistory, { role: 'assistant', content: aiMsg }]);
      setInputValue('');
    } catch (err) {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Error al conectar con el servidor' }]);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar historial con confirmación natural
  const handleClearHistory = () => {
    if (window.confirm('¿Seguro que quieres borrar toda la conversación? ¡Esta acción no se puede deshacer!')) {
      setChatHistory([]);
      localStorage.removeItem('byte-chat-history');
      setShowWelcome(true);
    }
  };

  // Funcionalidad: Editar nombre del chat (igual que ChatGPT, usando el chat seleccionado)
  const handleEditName = () => {
    let chats = localStorage.getItem('byte-chats');
    if (!chats) return;
    let chatsArr = JSON.parse(chats);
    // Obtener el id del chat seleccionado desde localStorage
    const currentId = localStorage.getItem('byte-selected-chat') || chatsArr[0]?.id;
    if (!currentId) return;
    const currentChat = chatsArr.find((c: any) => c.id === currentId);
    if (!currentChat) return;
    const newTitle = prompt('Nuevo nombre para el chat:', currentChat.title);
    if (newTitle && newTitle.trim() !== '' && newTitle !== currentChat.title) {
      const updated = chatsArr.map((c: any) => c.id === currentId ? { ...c, title: newTitle } : c);
      localStorage.setItem('byte-chats', JSON.stringify(updated));
      window.dispatchEvent(new Event('byte-chat-title-updated'));
    }
  };

  // Funcionalidad: Compartir chat (copiar historial al portapapeles)
  const handleShare = async () => {
    const text = chatHistory.map(m => `${m.role === 'user' ? 'Tú' : 'Byte'}: ${m.content}`).join('\n');
    await navigator.clipboard.writeText(text);
    alert('¡Historial copiado al portapapeles!');
  };

  // Funcionalidad: Archivar chat (mover a lista de archivados)
  const handleArchive = () => {
    const chats = localStorage.getItem('byte-chats');
    if (!chats) return;
    const chatsArr = JSON.parse(chats);
    const currentId = chatsArr[0]?.id;
    if (!currentId) return;
    let archived = JSON.parse(localStorage.getItem('byte-archived-chats') || '[]');
    const chatToArchive = chatsArr.find((c: any) => c.id === currentId);
    if (chatToArchive) {
      archived = [chatToArchive, ...archived];
      localStorage.setItem('byte-archived-chats', JSON.stringify(archived));
      const updated = chatsArr.filter((c: any) => c.id !== currentId);
      localStorage.setItem('byte-chats', JSON.stringify(updated));
      setChatHistory([]);
      setShowWelcome(true);
      window.dispatchEvent(new CustomEvent('byte-chat-selected', { detail: { id: updated[0]?.id } }));
    }
  };

  // Funcionalidad: Eliminar chat
  const handleDelete = () => {
    if (!window.confirm('¿Seguro que quieres eliminar este chat?')) return;
    const chats = localStorage.getItem('byte-chats');
    if (!chats) return;
    const chatsArr = JSON.parse(chats);
    const currentId = chatsArr[0]?.id;
    if (!currentId) return;
    const updated = chatsArr.filter((c: any) => c.id !== currentId);
    localStorage.setItem('byte-chats', JSON.stringify(updated));
    localStorage.removeItem(`byte-chat-history-${currentId}`);
    setChatHistory([]);
    setShowWelcome(true);
    window.dispatchEvent(new CustomEvent('byte-chat-selected', { detail: { id: updated[0]?.id } }));
  };

  return (
    <Center flex='1'>
      <VStack gap='6' justify='center' h='100%' maxH='100vh'>
        {showWelcome ? (
          <>
            <Heading
              size='3xl'
              style={{
                textAlign: 'center',
                animation: `${fadeInUp} 0.7s cubic-bezier(0.23, 1, 0.32, 1)`
              }}
            >
              Hola soy Byte,<br />¿Con qué puedo ayudar?
            </Heading>
            <Center
              style={{
                animation: `${fadeInUp} 0.7s 0.15s cubic-bezier(0.23, 1, 0.32, 1) both`
              }}
            >
              <InputGroup
                minW='768px'
                startElement={
                  <FileUploadRoot>
                    <FileUploadTrigger asChild>
                      <UploadIcon fontSize='2xl' color='fg' />
                    </FileUploadTrigger>
                    <FileUploadList />
                  </FileUploadRoot>
                }
                endElement={
                  <IconButton
                    fontSize='2xl'
                    size='sm'
                    borderRadius='full'
                    disabled={inputValue.trim() === '' || loading}
                    onClick={handleSend}
                  >
                    <FaArrowUp color='gray' size='1.5em' />
                  </IconButton>
                }
              >
                <Input
                  placeholder='Hablemos de lo que tú quieras...'
                  variant='subtle'
                  size='lg'
                  borderRadius='3xl'
                  value={inputValue}
                  onChange={handleInputValue}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  disabled={loading}
                />
              </InputGroup>
            </Center>
          </>
        ) : (
          <>
            <VStack
              align='stretch'
              maxW='700px'
              w='100%'
              gap={2}
              flex='1'
              overflowY='auto'
              ref={chatListRef}
              style={{
                animation: `${slideChat} 2.5s cubic-bezier(0.23, 1, 0.32, 1)`
              }}
            >
              {chatHistory.map((msg, idx) => (
                <Center
                  key={idx}
                  bg={msg.role === 'assistant' ? '#747474' : '#353536'}
                  color='white'
                  p='3'
                  borderRadius='xl'
                  alignSelf={msg.role === 'assistant' ? 'flex-start' : 'flex-end'}
                  maxW='90%'
                  style={{
                    animation: `${slideChat} 2.5s cubic-bezier(0.23, 1, 0.32, 1)`
                  }}
                >
                  {msg.content}
                </Center>
              ))}
            </VStack>
            <Center w='100%' maxW='700px'>
              <InputGroup
                minW='0'
                w='100%'
                startElement={
                  <FileUploadRoot>
                    <FileUploadTrigger asChild>
                      <UploadIcon fontSize='2xl' color='fg' />
                    </FileUploadTrigger>
                    <FileUploadList />
                  </FileUploadRoot>
                }
                endElement={
                  <IconButton
                    fontSize='2xl'
                    size='sm'
                    borderRadius='full'
                    disabled={inputValue.trim() === '' || loading}
                    onClick={handleSend}
                  >
                    <FaArrowRight color='gray' size='1.5em' />
                  </IconButton>
                }
              >
                <Input
                  placeholder='Escribe tu mensaje...'
                  variant='subtle'
                  size='lg'
                  borderRadius='3xl'
                  value={inputValue}
                  onChange={handleInputValue}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  disabled={loading}
                />
              </InputGroup>
            </Center>
          </>
        )}
        <HStack gap='2'>
          <PromptButton
            icon={<FaPencilAlt color='white' size='1.2em' />}
            description='Editar nombre'
            onClick={handleEditName}
          />
          <PromptButton
            icon={<FaShareAlt color='white' size='1.2em' />}
            description='Compartir chat'
            onClick={handleShare}
          />
          <PromptButton
            icon={<FaArchive color='white' size='1.2em' />}
            description='Archivar chat'
            onClick={handleArchive}
          />
          <PromptButton
            icon={<FaTrash color='red' size='1.2em' />}
            description='Eliminar'
            onClick={handleDelete}
          />
          {!showWelcome && (
            <Button variant='ghost' colorScheme='red' onClick={handleClearHistory}>
              Limpiar chat
            </Button>
          )}
        </HStack>
      </VStack>
    </Center>
  );
}
