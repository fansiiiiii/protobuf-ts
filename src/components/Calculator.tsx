import { useState } from 'react';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const MAX_VALUE = 9999;

  const clearDisplay = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const handleDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      if (display === '0') {
        setDisplay(digit);
      } else if (parseInt(display + digit) <= MAX_VALUE) {
        setDisplay(display + digit);
      }
    }
  };

  const handleOperator = (op: string) => {
    if (firstOperand === null) {
      setFirstOperand(parseInt(display));
      setOperator(op);
      setWaitingForSecondOperand(true);
    } else if (!waitingForSecondOperand) {
      const result = calculate(firstOperand, parseInt(display), operator!);
      if (result !== null) {
        setDisplay(result.toString());
        setFirstOperand(result);
        setOperator(op);
        setWaitingForSecondOperand(true);
      }
    } else {
      setOperator(op);
    }
  };

  const calculate = (a: number, b: number, op: string): number | null => {
    let result: number;
    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      default:
        return null;
    }
    if (result > MAX_VALUE || result < -MAX_VALUE) {
      return null;
    }
    return result;
  };

  const handleEquals = () => {
    if (firstOperand !== null && operator !== null && !waitingForSecondOperand) {
      const result = calculate(firstOperand, parseInt(display), operator);
      if (result !== null) {
        setDisplay(result.toString());
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(true);
      } else {
        setDisplay('超出范围');
        setTimeout(() => clearDisplay(), 1500);
      }
    }
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const buttons = [
    { label: 'C', className: 'bg-red-500 hover:bg-red-600', onClick: clearDisplay },
    { label: '⌫', className: 'bg-gray-500 hover:bg-gray-600', onClick: handleBackspace },
    { label: '+', className: 'bg-orange-500 hover:bg-orange-600', onClick: () => handleOperator('+') },
    { label: '-', className: 'bg-orange-500 hover:bg-orange-600', onClick: () => handleOperator('-') },
    { label: '7', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('7') },
    { label: '8', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('8') },
    { label: '9', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('9') },
    { label: '=', className: 'bg-blue-500 hover:bg-blue-600 row-span-2', onClick: handleEquals },
    { label: '4', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('4') },
    { label: '5', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('5') },
    { label: '6', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('6') },
    { label: '1', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('1') },
    { label: '2', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('2') },
    { label: '3', className: 'bg-gray-700 hover:bg-gray-600', onClick: () => handleDigit('3') },
    { label: '0', className: 'bg-gray-700 hover:bg-gray-600 col-span-2', onClick: () => handleDigit('0') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-white">简单计算器</h1>
          <p className="text-gray-400 text-sm">支持 10000 以内加减法</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 mb-4">
          <div className="text-right">
            <span className="text-gray-400 text-sm">{operator ? `${firstOperand} ${operator}` : ''}</span>
            <div className="text-4xl font-bold text-white min-h-[60px]">
              {display}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className={`${button.className} text-white text-2xl font-semibold py-4 px-2 rounded-xl transition-all duration-150 active:scale-95`}
              style={{
                gridRow: button.className.includes('row-span-2') ? 'span 2' : undefined,
                gridColumn: button.className.includes('col-span-2') ? 'span 2' : undefined,
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-xs">结果范围: -9999 ~ 9999</p>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
