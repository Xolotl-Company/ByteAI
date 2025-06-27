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
  BirthdayIcon,
  ChartIcon,
  CodeIcon,
  EnterIcon,
  IllustrationIcon,
  UploadIcon,
} from './icons/other-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { keyframes } from '@emotion/react';

interface PromptButtonProps {
  icon?: React.ReactElement;
  description: string;
}

function PromptButton(props: PromptButtonProps) {
  const { icon, description } = props;
  return (
    <Button variant='outline' borderRadius='full'>
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
                    <EnterIcon fontSize='2xl' />
                  </IconButton>
                }
              >
                <Input
                  placeholder='Hablemos'
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
                    <EnterIcon fontSize='2xl' />
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
            icon={<IllustrationIcon color='green.500' fontSize='lg' />}
            description='Create image'
          />
          <PromptButton
            icon={<CodeIcon color='blue.500' fontSize='lg' />}
            description='Code'
          />
          <PromptButton
            icon={<ChartIcon color='cyan.400' fontSize='lg' />}
            description='Analyze data'
          />
          <PromptButton
            icon={<BirthdayIcon color='cyan.400' fontSize='lg' />}
            description='Surprise'
          />
          <PromptButton description='More' />
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
