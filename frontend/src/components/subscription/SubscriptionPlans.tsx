import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';

export interface SubscriptionPlansProps {
    onSelectPlan: (plan: string) => void;
    currentPlan?: string;
    selectedPlan: string | null;
    disabled?: boolean;
}

const StyledCard = styled(Card)<{ selected?: boolean }>(({ theme, selected }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease-in-out',
    border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid rgba(0, 0, 0, 0.12)',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4]
    }
}));

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        description: 'Perfect for trying out our service',
        features: [
            '1 chatbot',
            '100 messages per month',
            'Basic support',
            'Basic analytics'
        ]
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '$10',
        description: 'Great for personal projects',
        features: [
            '5 chatbots',
            '1,000 messages per month',
            'Priority support',
            'Advanced analytics',
            'Custom branding'
        ]
    },
    {
        id: 'professional',
        name: 'Professional',
        price: '$29',
        description: 'Perfect for businesses',
        features: [
            'Unlimited chatbots',
            'Unlimited messages',
            '24/7 priority support',
            'Advanced analytics',
            'Custom branding',
            'API access',
            'Team collaboration'
        ]
    }
];

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
    onSelectPlan,
    currentPlan = 'free',
    selectedPlan,
    disabled = false
}) => {
    return (
        <Grid container spacing={3}>
            {plans.map((plan) => (
                <Grid item xs={12} md={4} key={plan.id}>
                    <StyledCard selected={selectedPlan === plan.id}>
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" component="div">
                                    {plan.name}
                                </Typography>
                                {currentPlan === plan.id && (
                                    <Chip
                                        label="Current Plan"
                                        color="primary"
                                        size="small"
                                    />
                                )}
                            </Box>
                            <Typography variant="h4" color="primary" gutterBottom>
                                {plan.price}
                                <Typography variant="caption" color="text.secondary">
                                    /month
                                </Typography>
                            </Typography>
                            <Typography color="text.secondary" paragraph>
                                {plan.description}
                            </Typography>
                            <List disablePadding>
                                {plan.features.map((feature) => (
                                    <ListItem key={feature} dense disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <CheckIcon color="primary" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={feature}
                                            primaryTypographyProps={{
                                                variant: 'body2'
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                        <Box sx={{ p: 2, pt: 0 }}>
                            <Button
                                fullWidth
                                variant={selectedPlan === plan.id ? "contained" : "outlined"}
                                onClick={() => onSelectPlan(plan.id)}
                                disabled={disabled || currentPlan === plan.id}
                            >
                                {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                            </Button>
                        </Box>
                    </StyledCard>
                </Grid>
            ))}
        </Grid>
    );
};

export default SubscriptionPlans;
