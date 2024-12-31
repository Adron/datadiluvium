-- SQL Server (T-SQL) specific DDL example
CREATE TABLE [dbo].[Customers] (
    [CustomerID] UNIQUEIDENTIFIER DEFAULT NEWID() ROWGUIDCOL,
    [AccountNumber] NVARCHAR(20) NOT NULL,
    [FirstName] NVARCHAR(50) NOT NULL,
    [LastName] NVARCHAR(50) NOT NULL,
    [Email] NVARCHAR(255),
    [CreatedDate] DATETIME2(7) DEFAULT SYSDATETIME(),
    [LastModified] DATETIME2(7),
    [Status] TINYINT DEFAULT 1,
    [RowVersion] ROWVERSION,
    CONSTRAINT [PK_Customers] PRIMARY KEY CLUSTERED ([CustomerID])
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Orders] (
    [OrderID] BIGINT IDENTITY(1,1) NOT NULL,
    [CustomerID] UNIQUEIDENTIFIER NOT NULL,
    [OrderDate] DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    [TotalAmount] DECIMAL(19,4) NOT NULL,
    [OrderStatus] NVARCHAR(20) DEFAULT N'Pending',
    INDEX [IX_Orders_CustomerID] NONCLUSTERED ([CustomerID]) WITH (FILLFACTOR = 90, PAD_INDEX = ON),
    CONSTRAINT [PK_Orders] PRIMARY KEY CLUSTERED ([OrderID]),
    CONSTRAINT [FK_Orders_Customers] FOREIGN KEY ([CustomerID]) 
        REFERENCES [dbo].[Customers] ([CustomerID])
        ON DELETE CASCADE
        WITH (NOCHECK)
) WITH (DATA_COMPRESSION = PAGE);
GO

-- T-SQL specific features: Table valued parameters
CREATE TYPE [dbo].[OrderItemType] AS TABLE (
    [ProductID] INT,
    [Quantity] INT,
    [UnitPrice] DECIMAL(19,4)
);
GO

-- Stored procedure using T-SQL specific features
CREATE PROCEDURE [dbo].[usp_CreateOrder]
    @CustomerID UNIQUEIDENTIFIER,
    @OrderItems [dbo].[OrderItemType] READONLY,
    @OrderID BIGINT OUTPUT
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @TotalAmount DECIMAL(19,4) = 0;
        
        SELECT @TotalAmount = SUM(Quantity * UnitPrice)
        FROM @OrderItems;
        
        INSERT INTO [dbo].[Orders] ([CustomerID], [TotalAmount])
        OUTPUT INSERTED.OrderID INTO @OrderID
        VALUES (@CustomerID, @TotalAmount);
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        THROW;
    END CATCH;
END;
GO
