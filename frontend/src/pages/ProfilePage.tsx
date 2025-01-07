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

interface SubscriptionStatus {
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

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
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        setSubscriptionLoading(true);
        setError(null); // Clear any previous errors

        // Make sure REACT_APP_API_URL doesn't end with /api
        const baseUrl = process.env.REACT_APP_API_URL?.replace(/\/api$/, '');
        const response = await fetch(`${baseUrl}/api/subscription/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Subscription status response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch subscription status');
        }

        setSubscriptionStatus(data.subscription);
      } catch (err) {
        console.error('Error fetching subscription status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription status');
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
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

  const handleCancelSubscription = async () => {
    try {
      console.log('Starting subscription cancellation...');
      setSubscriptionLoading(true);
      setError(null); // Clear any previous errors

      // Make sure REACT_APP_API_URL doesn't end with /api
      const baseUrl = process.env.REACT_APP_API_URL?.replace(/\/api$/, '');
      const response = await fetch(`${baseUrl}/api/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Cancellation response:', response);
      const responseData = await response.json();
      console.log('Cancellation response data:', responseData);

      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to cancel subscription';
        throw new Error(errorMessage);
      }

      // Update subscription status with the returned data
      if (responseData.subscription) {
        setSubscriptionStatus(responseData.subscription);
      }

      // Show success message
      setMessage({ type: 'success', text: responseData.message || 'Subscription successfully cancelled' });
      
      // Close the dialog
      setOpenDialog(false);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      // Don't close dialog on error
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/app/subscription');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

            <Paper sx={{ p: 3, mb: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
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

            <Paper sx={{ p: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
              <Typography variant="h6" gutterBottom>
                Subscription Details
              </Typography>
              
              {subscriptionLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography color="textSecondary">Current Plan</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {user?.subscription || 'Free'}
                    </Typography>
                  </Box>

                  {subscriptionStatus && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography color="textSecondary">Status</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {subscriptionStatus.cancel_at_period_end 
                            ? 'Canceling at end of period' 
                            : subscriptionStatus.status}
                        </Typography>
                      </Box>

                      {subscriptionStatus.current_period_end && (
                        <Box sx={{ mb: 2 }}>
                          <Typography color="textSecondary">
                            {subscriptionStatus.cancel_at_period_end 
                              ? 'Access Until'
                              : 'Next Billing Date'}
                          </Typography>
                          <Typography variant="body1">
                            {formatDate(subscriptionStatus.current_period_end)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}

                  <Box sx={{ mt: 3 }}>
                    {user?.subscription === 'free' ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpgrade}
                        disabled={subscriptionLoading}
                      >
                        Upgrade Plan
                      </Button>
                    ) : (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        onClick={() => setOpenDialog(true)}
                        disabled={subscriptionLoading || (subscriptionStatus?.cancel_at_period_end ?? false)}
                      >
                        {subscriptionStatus?.cancel_at_period_end 
                          ? 'Cancellation Pending'
                          : 'Cancel Subscription'}
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="cancel-dialog-title"
      >
        <DialogTitle id="cancel-dialog-title">
          Cancel Subscription
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={subscriptionLoading}>
            No, Keep It
          </Button>
          <Button onClick={handleCancelSubscription} color="error" disabled={subscriptionLoading}>
            {subscriptionLoading ? 'Canceling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
