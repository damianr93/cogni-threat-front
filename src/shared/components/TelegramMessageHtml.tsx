import { Box } from "@mui/material";
import { sanitizeTelegramHtml } from "../utils/telegramHtml";

type TelegramMessageHtmlProps = {
  html: string;
};

const TelegramMessageHtml = ({ html }: TelegramMessageHtmlProps) => (
  <Box
    sx={{
      fontSize: "0.875rem",
      lineHeight: 1.5,
      wordBreak: "break-word",
      "& a": {
        color: "#4a90d9",
        textDecoration: "underline",
      },
      "& b, & strong": {
        fontWeight: 700,
      },
    }}
    dangerouslySetInnerHTML={{ __html: sanitizeTelegramHtml(html) }}
  />
);

export default TelegramMessageHtml;
