import React, { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  texts,
  speed = 100,
  deleteSpeed = 50,
  delay = 2000,
  className = ''
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];

    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false);
        setIsDeleting(true);
        return;
      }

      if (isDeleting) {
        // Deleting characters
        setDisplayText(currentText.substring(0, displayText.length - 1));

        if (displayText.length === 1) {
          setIsDeleting(false);
          setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }
      } else {
        // Typing characters
        setDisplayText(currentText.substring(0, displayText.length + 1));

        if (displayText === currentText) {
          setIsPaused(true);
        }
      }
    }, isPaused ? delay : isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [displayText, currentIndex, isDeleting, isPaused, texts, speed, deleteSpeed, delay]);

  return (
    <span className={className}>
      {displayText}
      <span className="typewriter-cursor">|</span>
    </span>
  );
};

export default TypewriterEffect;