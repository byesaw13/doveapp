import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';

export const AnimatedButton = motion(Button);

export const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
