import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Stack,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SpeedIcon from '@mui/icons-material/Speed';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import LandingNavbar from '../components/LandingNavbar';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  if (user) return null;

  const features = [
    {
      icon: <SmartToyIcon sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Chatbots',
      description: 'Create intelligent chatbots that understand and respond naturally to your users.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Quick Setup',
      description: 'Get your chatbot up and running in minutes with our intuitive interface.'
    },
    {
      icon: <IntegrationInstructionsIcon sx={{ fontSize: 40 }} />,
      title: 'Easy Integration',
      description: 'Seamlessly integrate your chatbot into any website with a simple code snippet.'
    },
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
      title: 'Custom Training',
      description: 'Train your chatbot with your own data to provide accurate and relevant responses.'
    }
  ];

  return (
    <Box>
      <LandingNavbar />
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          pt: { xs: 20, md: 24 },
          pb: { xs: 12, md: 16 },
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ mb: 1 }}>
            <Chip
              label="AI-Powered Chatbot Platform"
              color="primary"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                mb: 2,
                '& .MuiChip-label': {
                  px: 2,
                  py: 0.75
                }
              }}
            />
          </Box>

          <Typography
            variant="h1"
            component="h1"
            color="white"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '2.5rem', sm: '3.5rem' },
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}
          >
            Build Smarter Conversations with LiquoriceAI
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mb: 6,
              opacity: 0.8,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem' }
            }}
          >
            Create, customize, and deploy intelligent chatbots that understand your business.
            Enhance customer engagement with natural conversations powered by advanced AI technology.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 8 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'white',
                color: '#13234d',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'grey.100'
                },
                fontWeight: 600,
                borderRadius: '30px'
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                color: 'white',
                borderColor: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: 'grey.100',
                  bgcolor: 'rgba(255, 255, 255, 0.1)'
                },
                fontWeight: 600,
                borderRadius: '30px'
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          sx={{ mb: 8, fontWeight: 700 }}
        >
          Why Choose LiquoriceAI?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.3s ease-in-out'
                  }
                }}
                elevation={0}
                variant="outlined"
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Join thousands of businesses using LiquoriceAI to enhance their customer experience.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ mt: 2, borderRadius: '30px', color: '#fff', fontWeight: 600, fontSize: '1.2rem', px: 4, py: 2 }}
            >
              Create Your Free Account
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
