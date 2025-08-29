import axios from 'axios';
import { API_BASE_URL, endpoints, mockData } from './config';
import { toast } from 'react-toastify';

// Mock OTP for development
const MOCK_OTP = '123456';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async sendOTP(emailOrMobile) {
    try {
      // Mock API call for development
      console.log('Sending OTP to:', emailOrMobile);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For development, we'll use mock OTP
      toast.info(`OTP sent! (Development mode: Use ${MOCK_OTP})`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        data: { otp: MOCK_OTP } // Only for development
      };
      
      // Production code would be:
      // const response = await axios.post(`${API_BASE_URL}${endpoints.auth.sendOtp}`, {
      //   emailOrMobile
      // });
      // return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOTP(emailOrMobile, otp) {
    try {
      // Mock verification for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (otp === MOCK_OTP) {
        // Check if user exists (mock data)
        const existingUser = mockData.users.find(
          u => u.email === emailOrMobile || u.mobile === emailOrMobile
        );
        
        if (existingUser) {
          // Login existing user
          const token = 'mock-jwt-token-' + Date.now();
          localStorage.setItem('token', token);
          
          return {
            success: true,
            isNewUser: false,
            user: existingUser,
            token
          };
        } else {
          // New user - redirect to signup
          return {
            success: true,
            isNewUser: true,
            tempToken: 'temp-token-' + Date.now()
          };
        }
      } else {
        throw new Error('Invalid OTP');
      }
      
      // Production code:
      // const response = await axios.post(`${API_BASE_URL}${endpoints.auth.verifyOtp}`, {
      //   emailOrMobile,
      //   otp
      // });
      // return response.data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async signup(userData) {
    try {
      // Mock signup for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('token', token);
      
      return {
        success: true,
        user: newUser,
        token
      };
      
      // Production code:
      // const response = await axios.post(`${API_BASE_URL}${endpoints.auth.signup}`, userData);
      // return response.data;
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  }

  async updateProfile(userData) {
    try {
      // Mock update for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        user: userData
      };
      
      // Production code:
      // const response = await axios.put(`${API_BASE_URL}${endpoints.auth.profile}`, userData, {
      //   headers: {
      //     Authorization: `Bearer ${this.token}`
      //   }
      // });
      // return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export default new AuthService();