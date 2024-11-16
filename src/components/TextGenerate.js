// TextGenerateEffect.js
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './../utils/cn'; // import your cn utility

function TextGenerateEffect({ text, duration = 0.3, className }) {
  return (
    <motion.div className="inline-block whitespace-pre">
      {text.split("").map((char, index) => (
        <motion.span
          key={char + index}
          className={cn("inline-block whitespace-pre dark:text-neutral-200 text-neutral-800", className)}
          initial={{ opacity: 0, filter: "blur(4px)", rotateX: 90, y: 5 }}
          whileInView={{
            opacity: 1,
            filter: "blur(0px)",
            rotateX: 0,
            y: 0,
          }}
          transition={{
            ease: "easeOut",
            duration: duration,
            delay: index * 0.015,
          }}
          viewport={{ once: true }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default TextGenerateEffect;
