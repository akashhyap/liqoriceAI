import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Grid,
  Avatar,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { PasswordUpdateRequest } from '../types';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, updateUser, isLoading, loadUser } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    loadUser();
    fetchSubscriptionStatus();
  }, [loadUser]);

  useEffect(() => {
    if (user) {
      console.log('User data:', user); // Debug log
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography>Please log in to view your profile.</Typography>
      </Box>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ name, email });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile'
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      const passwordData: PasswordUpdateRequest = {
        currentPassword,
        newPassword
      };
      await updateUser(passwordData);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update password'
      });
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subscription/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription status:', err);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      await fetchSubscriptionStatus();
      setOpenDialog(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpgrade = () => {
    navigate('/app/subscription');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  margin: '0 auto',
                  mb: 2,
                  fontSize: '2.5rem',
                  bgcolor: 'primary.main',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                {user.email}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Member since: {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'N/A'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'}}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <form onSubmit={handleUpdateProfile}>
                <TextField
                  label="Name"
                  fullWidth
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  sx={{ borderRadius: '8px', color: '#ffffff', mt: 2  }}
                >
                  Update Profile
                </Button>
              </form>
            </Paper>

            <Paper sx={{ p: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <form onSubmit={handleUpdatePassword}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  sx={{ borderRadius: '8px', color: '#ffffff', mt: 2  }}
                >
                  Update Password
                </Button>
              </form>
            </Paper>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary">Email</Typography>
                  <Typography variant="body1">{user?.email}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Subscription Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary">Current Plan</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {user?.subscription || 'Free'}
                  </Typography>
                </Box>
                {subscriptionStatus && (
                  <Box sx={{ mb: 2 }}>
                    <Typography color="textSecondary">Status</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {subscriptionStatus.cancel_at_period_end 
                        ? 'Canceling at end of period' 
                        : subscriptionStatus.status}
                    </Typography>
                    {subscriptionStatus.cancel_at_period_end && (
                      <Typography variant="body2" color="textSecondary">
                        Access until: {new Date(subscriptionStatus.current_period_end * 1000).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                )}
                <Box sx={{ mt: 2 }}>
                  {user?.subscription === 'free' ? (
                    <Button variant="contained" color="primary" onClick={handleUpgrade}>
                      Upgrade Plan
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => setOpenDialog(true)}
                      disabled={subscriptionStatus?.cancel_at_period_end}
                    >
                      {subscriptionStatus?.cancel_at_period_end 
                        ? 'Cancellation Pending' 
                        : 'Cancel Subscription'}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription? You'll continue to have access to your current plan until the end of your billing period.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>No, Keep It</Button>
          <Button onClick={handleCancelSubscription} color="error">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
