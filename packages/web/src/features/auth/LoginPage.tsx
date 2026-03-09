import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/slices/authSlice';
import { motion } from 'framer-motion';
import { Loader2, Terminal, Shield } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   TERMINAL LOGIN
   CLI-style authentication experience
   ═══════════════════════════════════════════════════════════════════════════ */

type LoginStep = 'IDENTITY' | 'CREDENTIAL' | 'VERIFYING';

export default function TerminalLogin() {
  const [step, setStep] = useState<LoginStep>('IDENTITY');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logs, setLogs] = useState<string[]>([
    'SENTRY_OS v4.0.2 [SECURE CONNECTION]',
    '───────────────────────────────────',
    'INIT: ESTABLISHING SECURE LINK...',
    'READY: AWAITING OPERATOR IDENTITY',
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((state) => state.auth);

  // Keep focus on hidden input
  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  const handleCommand = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;

    if (step === 'IDENTITY') {
      if (!email.trim()) {
        addLog('ERR: IDENTITY REQUIRED');
        return;
      }
      addLog(`> IDENTITY: ${email}`);
      addLog('REQ: ACCESS_CODE');
      setStep('CREDENTIAL');
    } else if (step === 'CREDENTIAL') {
      if (!password) {
        addLog('ERR: ACCESS_CODE REQUIRED');
        return;
      }
      addLog('> ACCESS_CODE: ************');
      addLog('INIT: HANDSHAKE PROTOCOL...');
      addLog('DECRYPTING AUTHENTICATION KEY...');
      setStep('VERIFYING');

      try {
        const result = await dispatch(login({ identifier: email, password }));
        
        if (login.fulfilled.match(result)) {
          addLog('✓ SIGNATURE VERIFIED');
          addLog('✓ CLEARANCE: LEVEL 5');
          addLog('ACCESS GRANTED. WELCOME, COMMANDER.');
          addLog('REDIRECTING TO COMMAND CENTER...');

          setTimeout(() => navigate('/'), 1000);
        } else {
          addLog('ERR: INVALID CREDENTIALS');
          addLog('CONNECTION TERMINATED');
          addLog('RESETTING SECURE LINK...');
          setTimeout(() => {
            setStep('IDENTITY');
            setEmail('');
            setPassword('');
            setLogs([
              'SENTRY_OS v4.0.2 [SECURE CONNECTION]',
              '───────────────────────────────────',
              'CONNECTION RESET. RETRY AUTHENTICATION.',
            ]);
          }, 1500);
        }
      } catch {
        addLog('ERR: NETWORK FAILURE');
        addLog('RETRYING...');
      }
    }
  };

  const currentValue = step === 'IDENTITY' ? email : password;
  const cursorPosition = currentValue.length * 9.6;

  return (
    <div
      className="h-screen w-screen bg-terminal-950 text-success font-mono text-sm overflow-hidden flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="p-4 border-b border-terminal-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-terminal-500">
          <Terminal className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Secure Gateway</span>
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
        {step !== 'VERIFYING' && (
          <div className="flex items-center gap-2">
            <span className="text-terminal-500">
              {step === 'IDENTITY' ? 'usr>' : 'pwd>'}
            </span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type={step === 'IDENTITY' ? 'email' : 'password'}
                value={currentValue}
                onChange={(e) =>
                  step === 'IDENTITY'
                    ? setEmail(e.target.value)
                    : setPassword(e.target.value)
                }
                onKeyDown={handleCommand}
                className="bg-transparent border-none outline-none w-full text-terminal-100 placeholder-terminal-700"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {/* Blinking Cursor */}
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="absolute top-0 h-5 w-2 bg-success pointer-events-none"
                style={{ left: `${cursorPosition}px` }}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {step === 'VERIFYING' && (
          <div className="mt-4 flex items-center gap-2 text-success animate-pulse">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>DECRYPTING KEY...</span>
          </div>
        )}

        {/* Hint */}
        {step === 'IDENTITY' && (
          <div className="mt-8 text-terminal-600 text-xs">
            <p>Enter your operator email to begin authentication.</p>
            <p className="mt-1">
              New operator?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-success hover:underline"
              >
                Request Access
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-terminal-800 text-center text-terminal-600 text-[10px]">
        SENTRY COLLABORATIVE OS • AUTHORIZED PERSONNEL ONLY
      </div>
    </div>
  );
}
