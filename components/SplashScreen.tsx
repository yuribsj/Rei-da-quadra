import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const LOGO_SIZE = W * 0.55;

// Particle configs for floating sparkles
const PARTICLES = [
  { x: 0.10, y: 0.25, size: 6,  delay: 0 },
  { x: 0.85, y: 0.30, size: 4,  delay: 150 },
  { x: 0.20, y: 0.70, size: 5,  delay: 300 },
  { x: 0.78, y: 0.65, size: 3,  delay: 100 },
  { x: 0.50, y: 0.18, size: 5,  delay: 250 },
  { x: 0.35, y: 0.80, size: 4,  delay: 200 },
  { x: 0.65, y: 0.78, size: 6,  delay: 50 },
  { x: 0.92, y: 0.50, size: 3,  delay: 350 },
];

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  // Logo animations
  const logoScale   = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate  = useRef(new Animated.Value(0)).current;

  // Ring pulse
  const ringScale   = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Glow
  const glowScale   = useRef(new Animated.Value(0.3)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Particles
  const particleAnims = useRef(
    PARTICLES.map(() => ({
      opacity:  new Animated.Value(0),
      scale:    new Animated.Value(0),
      translateY: new Animated.Value(0),
    })),
  ).current;

  // Exit
  const exitScale   = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Logo entrance — scale up with bounce + fade in + subtle rotation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: -0.02,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(logoRotate, {
          toValue: 0,
          tension: 120,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Phase 2: Gold ring pulse (starts at 200ms)
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 3: Glow behind logo
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Phase 4: Sparkle particles float up
    particleAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(400 + PARTICLES[i].delay),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 100,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: -30,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: -60,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Phase 5: Exit — zoom in and fade out
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitScale, {
          toValue: 1.15,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => onFinish());
    }, 2200);

    return () => clearTimeout(exitTimer);
  }, []);

  const rotateInterpolation = logoRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.root,
        { opacity: exitOpacity, transform: [{ scale: exitScale }] },
      ]}
    >
      {/* Radial glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Ring pulse */}
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Sparkle particles */}
      {particleAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: PARTICLES[i].x * W,
              top:  PARTICLES[i].y * H,
              width:  PARTICLES[i].size,
              height: PARTICLES[i].size,
              borderRadius: PARTICLES[i].size / 2,
              opacity: anim.opacity,
              transform: [
                { scale: anim.scale },
                { translateY: anim.translateY },
              ],
            },
          ]}
        />
      ))}

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              { rotate: rotateInterpolation },
            ],
          },
        ]}
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  logoWrap: {
    width:  LOGO_SIZE,
    height: LOGO_SIZE,
  },
  logo: {
    width:  '100%',
    height: '100%',
  },
  glow: {
    position: 'absolute',
    width:  LOGO_SIZE * 1.8,
    height: LOGO_SIZE * 1.8,
    borderRadius: LOGO_SIZE,
    backgroundColor: 'rgba(212, 168, 67, 0.12)',
  },
  ring: {
    position: 'absolute',
    width:  LOGO_SIZE * 1.2,
    height: LOGO_SIZE * 1.2,
    borderRadius: LOGO_SIZE * 0.6,
    borderWidth: 2,
    borderColor: 'rgba(212, 168, 67, 0.6)',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#D4A843',
    shadowColor: '#D4A843',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
