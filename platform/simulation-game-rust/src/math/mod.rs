//! Math utilities for simulation
//!
//! Provides deterministic RNG and mathematical functions required for
//! reproducible simulation results.

use serde::{Deserialize, Serialize};

/// Deterministic random number generator using xorshift64*
/// 
/// This RNG is fully deterministic across platforms and architectures,
/// critical for esports where results must be verifiable.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct DeterministicRng {
    state: u64,
    seed: u64,
}

impl DeterministicRng {
    /// Creates a new RNG with the given seed
    /// 
    /// # Arguments
    /// * `seed` - The initial seed value. If 0, a default non-zero seed is used.
    ///
    /// # Example
    /// ```
    /// use simulation_rust::math::DeterministicRng;
    ///
    /// let rng = DeterministicRng::new(12345);
    /// ```
    pub fn new(seed: u64) -> Self {
        let seed = if seed == 0 {
            0x9E3779B97F4A7C15
        } else {
            seed
        };
        Self { state: seed, seed }
    }

    /// Returns the original seed
    pub fn seed(&self) -> u64 {
        self.seed
    }

    /// Generates the next u64 using xorshift64* algorithm
    /// 
    /// This algorithm provides good statistical properties while being
    /// extremely fast (single-digit nanoseconds per call).
    #[inline(always)]
    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.state = x;
        x.wrapping_mul(0x2545F4914F6CDD1D)
    }

    /// Generates a random f32 in [0.0, 1.0)
    /// 
    /// Uses 24 bits of precision (enough for float mantissa).
    #[inline(always)]
    pub fn next_f32(&mut self) -> f32 {
        ((self.next_u64() >> 40) as f32) / ((1u64 << 24) as f32)
    }

    /// Generates a random f32 in [min, max)
    #[inline(always)]
    pub fn next_range(&mut self, min: f32, max: f32) -> f32 {
        min + self.next_f32() * (max - min)
    }

    /// Generates a random bool with given probability
    #[inline(always)]
    pub fn next_bool(&mut self, probability: f32) -> bool {
        self.next_f32() < probability
    }

    /// Generates a normally distributed random value (Box-Muller transform)
    /// 
    /// # Arguments
    /// * `mean` - The mean of the distribution
    /// * `std_dev` - The standard deviation
    pub fn next_normal(&mut self, mean: f32, std_dev: f32) -> f32 {
        // Box-Muller transform
        let u1 = self.next_f32().max(1e-7);
        let u2 = self.next_f32();
        let z0 = (-2.0 * u1.ln()).sqrt() * (2.0 * std::f32::consts::PI * u2).cos();
        mean + std_dev * z0
    }

    /// Resets the RNG to its initial state
    pub fn reset(&mut self) {
        self.state = self.seed;
    }

    /// Creates a stable hash from multiple parts
    /// 
    /// Useful for deriving deterministic seeds from match/round context.
    pub fn hash_seed(parts: &[&str]) -> u64 {
        use sha2::{Digest, Sha256};
        use byteorder::ByteOrder;

        let concatenated = parts.join("|");
        let hash = Sha256::digest(concatenated.as_bytes());
        byteorder::LittleEndian::read_u64(&hash[0..8])
    }
}

impl Default for DeterministicRng {
    fn default() -> Self {
        Self::new(0x9E3779B97F4A7C15)
    }
}

/// Linear interpolation between two values
#[inline(always)]
pub fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t.clamp(0.0, 1.0)
}

/// Clamp a value between min and max
#[inline(always)]
pub fn clamp<T: PartialOrd>(value: T, min: T, max: T) -> T {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

/// Fast approximation of atan2 for hit probability calculations
#[inline(always)]
pub fn fast_atan2(y: f32, x: f32) -> f32 {
    y.atan2(x)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_determinism() {
        let mut rng1 = DeterministicRng::new(12345);
        let mut rng2 = DeterministicRng::new(12345);

        for _ in 0..1000 {
            assert_eq!(rng1.next_u64(), rng2.next_u64());
        }
    }

    #[test]
    fn test_f32_range() {
        let mut rng = DeterministicRng::new(12345);

        for _ in 0..1000 {
            let val = rng.next_f32();
            assert!(val >= 0.0 && val < 1.0);
        }
    }

    #[test]
    fn test_range() {
        let mut rng = DeterministicRng::new(12345);

        for _ in 0..1000 {
            let val = rng.next_range(10.0, 20.0);
            assert!(val >= 10.0 && val < 20.0);
        }
    }

    #[test]
    fn test_reset() {
        let mut rng = DeterministicRng::new(12345);
        let first = rng.next_u64();
        rng.next_u64();
        rng.reset();
        assert_eq!(rng.next_u64(), first);
    }

    #[test]
    fn test_hash_seed() {
        let h1 = DeterministicRng::hash_seed(&["match", "round", "1"]);
        let h2 = DeterministicRng::hash_seed(&["match", "round", "1"]);
        let h3 = DeterministicRng::hash_seed(&["match", "round", "2"]);

        assert_eq!(h1, h2);
        assert_ne!(h1, h3);
    }
}
