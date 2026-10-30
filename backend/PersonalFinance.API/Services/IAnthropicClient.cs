namespace PersonalFinance.API.Services
{
    public interface IAnthropicClient
    {
        Task<string> SendMessageAsync(string systemPrompt, string userMessage);
    }
}
