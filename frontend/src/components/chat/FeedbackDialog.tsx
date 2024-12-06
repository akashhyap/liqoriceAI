import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Rating,
    Typography,
    Box
} from '@mui/material';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';

interface FeedbackDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (rating: number) => void;
    sessionId: string;
}

interface IconContainerProps {
    value: number;
}

const customIcons: {
    [index: string]: {
        icon: React.ReactElement;
        label: string;
    };
} = {
    1: {
        icon: <SentimentVeryDissatisfiedIcon color="error" />,
        label: 'Very Dissatisfied',
    },
    2: {
        icon: <SentimentDissatisfiedIcon color="error" />,
        label: 'Dissatisfied',
    },
    3: {
        icon: <SentimentSatisfiedIcon color="warning" />,
        label: 'Neutral',
    },
    4: {
        icon: <SentimentSatisfiedAltIcon color="success" />,
        label: 'Satisfied',
    },
    5: {
        icon: <SentimentVerySatisfiedIcon color="success" />,
        label: 'Very Satisfied',
    },
};

const IconContainer = React.forwardRef<HTMLSpanElement, IconContainerProps>(
    ({ value, ...other }, ref) => {
        const { icon, label } = customIcons[value];
        return React.cloneElement(icon, {
            ref,
            ...other
        });
    }
);

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
    open,
    onClose,
    onSubmit,
    sessionId
}) => {
    const [rating, setRating] = React.useState<number | null>(null);

    const handleSubmit = () => {
        if (rating !== null) {
            onSubmit(rating);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>How was your chat experience?</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                    <Rating
                        name="chat-feedback"
                        value={rating}
                        onChange={(_, newValue) => setRating(newValue)}
                        IconContainerComponent={IconContainer}
                        highlightSelectedOnly
                        size="large"
                    />
                    {rating && (
                        <Typography sx={{ mt: 1 }} color="text.secondary">
                            {customIcons[rating].label}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Skip</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={rating === null}
                >
                    Submit Feedback
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FeedbackDialog;
