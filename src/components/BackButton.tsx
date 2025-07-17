import { Box, Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({ href = "/dashboard", label = "Back to Dashboard" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(href);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{
          borderColor: "rgba(123, 97, 255, 0.3)",
          color: "#7B61FF",
          "&:hover": {
            borderColor: "#7B61FF",
            background: "rgba(123, 97, 255, 0.1)",
          },
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 2
        }}
      >
        {label}
      </Button>
    </Box>
  );
} 