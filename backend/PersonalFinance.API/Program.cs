using System.Security.Cryptography.X509Certificates;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using PersonalFinance.API.Helpers;
using PersonalFinance.API.Services;
using PetaPoco;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLongForSecurity!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PersonalFinanceApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PersonalFinanceApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero // No grace period for expiration
    };
});

// HttpContextAccessor for UserContext
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContext, UserContext>();

// Auth service
builder.Services.AddScoped<IAuthService, AuthService>();

// Database configuration
// PostgreSQL configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ??
                      "Host=localhost;Database=postgres;Username=postgres;Password=qkOfz2oQWtF56pp0ZFtR;";
builder.Services.AddScoped<IDatabase>(provider => new Database(connectionString, "Npgsql"));

// Service registrations
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IBudgetService, BudgetService>();
builder.Services.AddScoped<IBudgetPlanService, BudgetPlanService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IReportsService, ReportsService>();

// AI services (categorization & search)
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<IAnthropicClient, AnthropicClient>();
builder.Services.AddScoped<ICategorizationService, CategorizationService>();
builder.Services.AddScoped<ISearchParserService, SearchParserService>();

// Teller.io bank sync services
var tellerEnvironment = builder.Configuration["Teller:Environment"] ?? "sandbox";
var tellerCertPath = builder.Configuration["Teller:CertificatePath"];
var tellerKeyPath = builder.Configuration["Teller:PrivateKeyPath"];

Console.WriteLine($"Teller Environment: {tellerEnvironment}");
Console.WriteLine($"Teller Certificate Path: {tellerCertPath}");
Console.WriteLine($"Teller Private Key Path: {tellerKeyPath}");

builder.Services.AddHttpClient<ITellerClient, TellerClient>()
    .ConfigurePrimaryHttpMessageHandler(() =>
    {
        var handler = new HttpClientHandler();

        // Only add certificate for non-sandbox environments
        if (!string.Equals(tellerEnvironment, "sandbox", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrEmpty(tellerCertPath)
            && !string.IsNullOrEmpty(tellerKeyPath))
        {
            try
            {
                Console.WriteLine("Loading Teller certificate...");

                // Check if files exist
                if (!File.Exists(tellerCertPath))
                {
                    Console.WriteLine($"ERROR: Certificate file not found: {tellerCertPath}");
                    Console.WriteLine($"Current directory: {Directory.GetCurrentDirectory()}");
                }
                else if (!File.Exists(tellerKeyPath))
                {
                    Console.WriteLine($"ERROR: Private key file not found: {tellerKeyPath}");
                }
                else
                {
                    // Load certificate with private key (PEM format)
                    // On Windows, we need to export and re-import to make the key non-ephemeral
                    var tempCert = X509Certificate2.CreateFromPemFile(tellerCertPath, tellerKeyPath);
                    var cert = new X509Certificate2(tempCert.Export(X509ContentType.Pfx));
                    handler.ClientCertificates.Add(cert);
                    Console.WriteLine($"Teller certificate loaded successfully: {cert.Subject}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR: Failed to load Teller certificate: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }
        else
        {
            Console.WriteLine("Teller running in sandbox mode (no certificate required)");
        }

        return handler;
    });
builder.Services.AddScoped<ITellerSyncService, TellerSyncService>();

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Use CORS middleware (must be before UseAuthorization)
app.UseCors("AllowAll");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
