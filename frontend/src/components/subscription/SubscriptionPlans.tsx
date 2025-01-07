import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { Plan } from '../../types';

interface SubscriptionPlansProps {
    currentPlan?: string;
    onSelectPlan: (planId: string) => void;
}

const plans: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
            '1 Chatbot',
            'Basic customization',
            'Community support',
            'Standard response time'
        ],
        recommended: false
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 29,
        features: [
            '5 Chatbots',
            'Advanced customization',
            'Email support',
            'Priority response time',
            'Basic analytics',
            'API access'
        ],
        recommended: true
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 99,
        features: [
            'Unlimited Chatbots',
            'Full customization',
            'Priority support',
            'Instant response time',
            'Advanced analytics',
            'API access',
            'Custom branding',
            'Team collaboration'
        ],
        recommended: false
    }
];

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
    currentPlan,
    onSelectPlan
}) => {
    const theme = useTheme();

    return (
        <Grid container spacing={3} alignItems="flex-start">
            {plans.map((plan) => (
                <Grid item key={plan.id} xs={12} sm={6} md={4}>
                    <Card
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            border: plan.recommended
                                ? `2px solid ${theme.palette.primary.main}`
                                : undefined
                        }}
                    >
                        {plan.recommended && (
                            <Chip
                                label="Recommended"
                                color="primary"
                                sx={{
                                    position: 'absolute',
                                    top: -12,
                                    right: 20,
                                    zIndex: 1
                                }}
                            />
                        )}
                        <CardHeader
                            title={plan.name}
                            titleTypographyProps={{ align: 'center' }}
                            subheaderTypographyProps={{ align: 'center' }}
                            sx={{
                                backgroundColor: theme.palette.grey[50]
                            }}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'baseline',
                                    mb: 2
                                }}
                            >
                                <Typography
                                    component="h2"
                                    variant="h3"
                                    color="text.primary"
                                >
                                    ${plan.price}
                                </Typography>
                                <Typography variant="h6" color="text.secondary">
                                    /mo
                                </Typography>
                            </Box>
                            <List>
                                {plan.features.map((feature) => (
                                    <ListItem key={feature} sx={{ py: 1, px: 0 }}>
                                        <ListItemIcon>
                                            <CheckIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary={feature} />
                                    </ListItem>
                                ))}
                            </List>
                            <Button
                                fullWidth
                                variant={currentPlan === plan.id ? "outlined" : "contained"}
                                onClick={() => onSelectPlan(plan.id)}
                                sx={{ mt: 2 }}
                                disabled={currentPlan === plan.id}
                            >
                                {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default SubscriptionPlans;
