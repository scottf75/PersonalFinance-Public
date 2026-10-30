namespace PersonalFinance.API.Helpers
{
    public interface IUserContext
    {
        int GetCurrentUserId();
        bool IsAuthenticated { get; }
    }
}
