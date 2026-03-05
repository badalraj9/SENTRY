import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register } from '../../store/slices/authSlice';
import { motion } from 'framer-motion';
import { Loader2, Terminal, Shield } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   TERMINAL REGISTER
   CLI-style account creation experience
   ═══════════════════════════════════════════════════════════════════════════ */

type RegisterStep = 'HANDLE' | 'EMAIL' | 'PASSWORD' | 'CONFIRM' | 'PROCESSING';

export default function TerminalRegister() {
  const [step, setStep] = useState<RegisterStep>('HANDLE');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'SENTRY_OS v4.0.2 [REGISTRATION PORTAL]',
    '───────────────────────────────────────',
    'INIT: NEW OPERATOR ONBOARDING',
    'REQ: OPERATOR HANDLE (UNIQUE IDENTIFIER)',
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  const getCurrentValue = () => {
    switch (step) {
      case 'HANDLE': return handle;
      case 'EMAIL': return email;
      case 'PASSWORD': return password;
      case 'CONFIRM': return confirm;
      default: return '';
    }
  };

  const getPrompt = () => {
    switch (step) {
      case 'HANDLE': return 'handle>';
      case 'EMAIL': return 'email>';
      case 'PASSWORD': return 'pwd>';
      case 'CONFIRM': return 'confirm>';
      default: return '>';
    }
  };

  const handleCommand = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;

    switch (step) {
      case 'HANDLE':
        if (!handle.trim()) {
          addLog('ERR: HANDLE REQUIRED');
          return;
        }
        addLog(`> HANDLE: ${handle}`);
        addLog('REQ: OPERATOR EMAIL');
        setStep('EMAIL');
        break;

      case 'EMAIL':
        if (!email.includes('@')) {
          addLog('ERR: INVALID EMAIL FORMAT');
          return;
        }
        addLog(`> EMAIL: ${email}`);
        addLog('REQ: ACCESS_CODE (MIN 8 CHARS)');
        setStep('PASSWORD');
        break;

      case 'PASSWORD':
        if (password.length < 8) {
          addLog('ERR: ACCESS_CODE TOO SHORT');
          return;
        }
        addLog('> ACCESS_CODE: ************');
        addLog('REQ: CONFIRM ACCESS_CODE');
        setStep('CONFIRM');
        break;

      case 'CONFIRM':
        if (confirm !== password) {
          addLog('ERR: ACCESS_CODES DO NOT MATCH');
          setConfirm('');
          return;
        }
        addLog('> CONFIRMED');
        addLog('INIT: GENERATING OPERATOR CREDENTIALS...');
        addLog('ALLOCATING SECURITY CLEARANCE...');
        setStep('PROCESSING');

        try {
          // Assuming displayName is same as handle for now
          const result = await dispatch(register({ handle, email, password, displayName: handle }));
          
          if (register.fulfilled.match(result)) {
            addLog('✓ OPERATOR REGISTERED');
            addLog('✓ CLEARANCE: LEVEL 1');
            addLog('WELCOME TO SENTRY, OPERATOR.');
            addLog('REDIRECTING TO COMMAND CENTER...');
            setTimeout(() => navigate('/'), 1000);
          } else {
            addLog('ERR: REGISTRATION FAILED');
            addLog('REASON: HANDLE OR EMAIL ALREADY EXISTS');
            setTimeout(() => {
              setStep('HANDLE');
              setHandle('');
              setEmail('');
              setPassword('');
              setConfirm('');
              setLogs([
                'SENTRY_OS v4.0.2 [REGISTRATION PORTAL]',
                '───────────────────────────────────────',
                'REGISTRATION RESET. PLEASE TRY AGAIN.',
              ]);
            }, 2000);
          }
        } catch {
          addLog('ERR: NETWORK FAILURE');
        }
        break;
    }
  };

  const currentValue = getCurrentValue();
  const cursorPosition = currentValue.length * 9.6;
  const isPasswordField = step === 'PASSWORD' || step === 'CONFIRM';

  return (
    <div
      className="h-screen w-screen bg-terminal-950 text-info font-mono text-sm overflow-hidden flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="p-4 border-b border-terminal-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-terminal-500">
          <Terminal className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Operator Registration</span>
        </div>
        <div className="flex items-center gap-2 text-terminal-600 text-xs">
          <Shield className="w-3 h-3" />
          <span>TLS 1.3 ENCRYPTED</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-8 overflow-y-auto max-w-3xl mx-auto w-full">
        {/* System Logs */}
        <div className="space-y-1 mb-6">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className={log.startsWith('ERR:') ? 'text-error' : log.startsWith('✓') ? 'text-success' : 'text-terminal-400'}
            >
              {log}
            </motion.div>
          ))}
        </div>

        {/* Active Prompt */}
        {step !== 'PROCESSING' && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-500">{getPrompt()}</span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type={isPasswordField ? 'password' : 'text'}
                value={currentValue}
                onChange={(e) => {
                  const val = e.target.value;
                  switch (step) {
                    case 'HANDLE': setHandle(val); break;
                    case 'EMAIL': setEmail(val); break;
                    case 'PASSWORD': setPassword(val); break;
                    case 'CONFIRM': setConfirm(val); break;
                  }
                }}
                onKeyDown={handleCommand}
                className="bg-transparent border-none outline-none w-full text-terminal-100"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="absolute top-0 h-5 w-2 bg-info pointer-events-none"
                style={{ left: `${cursorPosition}px` }}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {step === 'PROCESSING' && (
          <div className="mt-4 flex items-center gap-2 text-info animate-pulse">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>GENERATING CREDENTIALS...</span>
          </div>
        )}

        {/* Hint */}
        {step === 'HANDLE' && (
          <div className="mt-8 text-terminal-600 text-xs">
            <p>Already have access?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-success hover:underline"
              >
                Authenticate
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-terminal-800 text-center text-terminal-600 text-[10px]">
        SENTRY COLLABORATIVE OS • NEW OPERATOR ENROLLMENT
      </div>
    </div>
  );
}
