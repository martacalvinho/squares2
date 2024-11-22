use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("your_program_id_here");

#[program]
pub mod crypto_squares {
    use super::*;

    pub fn place_bid(
        ctx: Context<PlaceBid>,
        spot_id: u64,
        project_name: String,
        project_link: String,
        project_logo: String,
        bid_amount: u64,
    ) -> Result<()> {
        let spot = &mut ctx.accounts.spot;
        let bidder = &ctx.accounts.bidder;

        // Ensure bid is higher than current bid
        require!(
            bid_amount > spot.current_bid,
            CustomError::BidTooLow
        );

        // Transfer SOL from bidder to program
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &bidder.key(),
            &spot.key(),
            bid_amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                bidder.to_account_info(),
                spot.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update spot information
        spot.current_bid = bid_amount;
        spot.current_bidder = *bidder.key;
        spot.project_name = project_name;
        spot.project_link = project_link;
        spot.project_logo = project_logo;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub spot: Account<'info, Spot>,
    #[account(mut)]
    pub bidder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Spot {
    pub current_bid: u64,
    pub current_bidder: Pubkey,
    pub project_name: String,
    pub project_link: String,
    pub project_logo: String,
}

#[error_code]
pub enum CustomError {
    #[msg("Bid amount must be higher than current bid")]
    BidTooLow,
}